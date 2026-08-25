import sys
from pathlib import Path
import pytest

# Ensure project root is on sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from ai.orchestrator.search_extractor import SearchRequirementExtractor
from ai.matching.buyer_search import SemanticMatchingEngine
from app.repositories.product_repository import ProductRepository
from app.schemas.search import SearchRequest, RequirementExtraction


@pytest.mark.asyncio
async def test_order_independence_extraction():
    """Verify that requirement extraction is order-independent and phrasings produce identical structured outputs."""
    q1 = "70 pots under 2000 within 3 days"
    q2 = "70 pots in 3 days under 2000"
    q3 = "I need 70 pots within 3 days, budget is 2000"
    q4 = "Need pots, 70 pieces, can spend up to 2000 and need them in 3 days"

    e1 = SearchRequirementExtractor.extract(q1)
    e2 = SearchRequirementExtractor.extract(q2)
    e3 = SearchRequirementExtractor.extract(q3)
    e4 = SearchRequirementExtractor.extract(q4)

    for e in [e1, e2, e3, e4]:
        assert e.product == "pots"
        assert e.quantity == 70
        assert e.max_budget == 2000.0
        assert e.deadline_days == 3


@pytest.mark.asyncio
async def test_optional_requirements_extraction():
    """Verify missing fields remain None without inventing arbitrary defaults."""
    # Product only
    e_prod = SearchRequirementExtractor.extract("pots")
    assert e_prod.product == "pots"
    assert e_prod.quantity is None
    assert e_prod.max_budget is None
    assert e_prod.deadline_days is None

    # Product + Price
    e_price = SearchRequirementExtractor.extract("pots under 2000")
    assert e_price.product == "pots"
    assert e_price.quantity is None
    assert e_price.max_budget == 2000.0
    assert e_price.deadline_days is None

    # Product + Deadline
    e_dead = SearchRequirementExtractor.extract("pots within 3 days")
    assert e_dead.product == "pots"
    assert e_dead.quantity is None
    assert e_dead.max_budget is None
    assert e_dead.deadline_days == 3

    # Product + Quantity
    e_qty = SearchRequirementExtractor.extract("70 pots")
    assert e_qty.product == "pots"
    assert e_qty.quantity == 70
    assert e_qty.max_budget is None
    assert e_qty.deadline_days is None


@pytest.mark.asyncio
async def test_artisan_production_capacity_matching():
    """
    Verify section 12 requirement:
    Artisan A (prod-001: stock=10, cap=20/day, shipping=1) CAN fulfill 70 pots in 4 days (10 + 20*3 = 70).
    Incapable Artisan (prod-009: stock=40, cap=5/day, shipping=1) CANNOT fulfill 70 units in 4 days (40 + 5*3 = 55 < 70).
    """
    products = await ProductRepository.get_all_products()
    query = "70 pots under 3000 within 4 days"
    extracted = SearchRequirementExtractor.extract(query)
    request = SearchRequest(query=query, ai_mode=True)

    results = SemanticMatchingEngine.match_and_rank(products=products, request=request, extracted=extracted)

    result_ids = [p.id for p in results]

    # Artisan A (prod-001) MUST be included
    assert "prod-001" in result_ids

    # Incapable Artisan (prod-009) MUST NOT be included due to capacity constraint
    assert "prod-009" not in result_ids


@pytest.mark.asyncio
async def test_search_pipeline_without_deadline():
    """Verify when deadline is not provided, capacity capability over overall window is evaluated without inventing deadline."""
    products = await ProductRepository.get_all_products()
    query = "70 pots under 3000"
    extracted = SearchRequirementExtractor.extract(query)
    request = SearchRequest(query=query, ai_mode=True)

    assert extracted.deadline_days is None
    results = SemanticMatchingEngine.match_and_rank(products=products, request=request, extracted=extracted)
    assert len(results) > 0


@pytest.mark.asyncio
async def test_hybrid_semantic_search_non_keyword_overlap():
    """
    Verify dense semantic retrieval returns semantically matching products
    even when exact keywords do not overlap (e.g. 'something to keep plants in' -> planters / pots).
    """
    products = await ProductRepository.get_all_products()
    query = "something to keep plants in"
    extracted = SearchRequirementExtractor.extract(query)
    request = SearchRequest(query=query, ai_mode=True)

    results = SemanticMatchingEngine.match_and_rank(products=products, request=request, extracted=extracted)

    assert len(results) > 0
    top_categories = [p.category for p in results[:3]]
    # Top results must be Pottery / Planters
    assert "Pottery" in top_categories


@pytest.mark.asyncio
async def test_case_a_vs_case_b_capacity_matching():
    """
    Verify CASE A ('35 pots in 2 days') and CASE B ('35 pots'):
    An artisan with capacity=20/day, stock=0, shipping=0 can produce 20x2=40 >= 35 units in 2 days.
    Therefore prod-004 MUST appear in BOTH CASE A and CASE B.
    """
    products = await ProductRepository.get_all_products()

    # CASE B: "35 pots"
    e_b = SearchRequirementExtractor.extract("35 pots")
    res_b = SemanticMatchingEngine.match_and_rank(products=products, request=SearchRequest(query="35 pots", ai_mode=True), extracted=e_b)
    ids_b = [p.id for p in res_b]

    # CASE A: "35 pots in 2 days"
    e_a = SearchRequirementExtractor.extract("35 pots in 2 days")
    res_a = SemanticMatchingEngine.match_and_rank(products=products, request=SearchRequest(query="35 pots in 2 days", ai_mode=True), extracted=e_a)
    ids_a = [p.id for p in res_a]

    assert "prod-004" in ids_b, "prod-004 must appear in CASE B ('35 pots')"
    assert "prod-004" in ids_a, "prod-004 must appear in CASE A ('35 pots in 2 days')"

