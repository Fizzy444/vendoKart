import sys
import os
sys.path.insert(0, os.path.abspath("backend"))

import asyncio
from ai.orchestrator.search_extractor import SearchRequirementExtractor
from ai.matching.buyer_search import SemanticMatchingEngine
from app.schemas.search import SearchRequest, RequirementExtraction, ProductItem
from app.repositories.product_repository import ProductRepository


async def test_search_cases():
    print("=== Testing Search & Filter Matrix Cases 1 to 9 ===")
    products = await ProductRepository.get_all_products()
    print(f"Loaded {len(products)} candidate products from repository.\n")

    # CASE 1: Natural language query "70 pots needed under 3000 within 3 days"
    q1 = "70 pots needed under 3000 within 3 days"
    ext1 = SearchRequirementExtractor.extract(q1)
    print(f"CASE 1 Extracted Specs: {ext1}")
    res1 = SemanticMatchingEngine.match_and_rank(products, SearchRequest(query=q1, ai_mode=True), ext1)
    print(f"CASE 1 Results Count: {len(res1)}")
    assert len(res1) > 0, "CASE 1 should return matching pots"
    for p in res1:
        assert p.price <= 3000, f"Product price {p.price} exceeds max budget 3000"
        assert p.delivery_days <= 3, f"Delivery days {p.delivery_days} exceeds 3 days"
        print(f"  -> Match: {p.name} | Price: Rs. {p.price} | Delivery: {p.delivery_days}d")

    # CASE 2: Simple product query "pots"
    q2 = "pots"
    ext2 = SearchRequirementExtractor.extract(q2)
    res2 = SemanticMatchingEngine.match_and_rank(products, SearchRequest(query=q2, ai_mode=True), ext2)
    print(f"\nCASE 2 ('pots') Results Count: {len(res2)}")
    assert len(res2) >= 3, "CASE 2 should return Terracotta, Hand-painted, Clay Planters"
    for p in res2:
        print(f"  -> Match: {p.name} ({p.category})")

    # CASE 3: Search "pots" + Filter Price < Rs. 3,000
    res3 = SemanticMatchingEngine.match_and_rank(
        products, SearchRequest(query="pots", price_range="1000_3000", ai_mode=True), ext2
    )
    print(f"\nCASE 3 ('pots' under Rs. 3,000) Count: {len(res3)}")
    for p in res3:
        assert p.price <= 3000

    # CASE 4: Search "pots" + Filter Quantity = 50-100
    res4 = SemanticMatchingEngine.match_and_rank(
        products, SearchRequest(query="pots", quantity_range="50_100", ai_mode=True), ext2
    )
    print(f"\nCASE 4 ('pots' quantity 50-100) Count: {len(res4)}")
    assert len(res4) > 0

    # CASE 5: Search "pots" + Nearby Me ("Kumbakonam, Tamil Nadu")
    res5 = SemanticMatchingEngine.match_and_rank(
        products,
        SearchRequest(query="pots", location_mode="nearby", user_location="Kumbakonam, Tamil Nadu", ai_mode=True),
        ext2,
    )
    print(f"\nCASE 5 ('pots' Nearby Me Kumbakonam) Count: {len(res5)}")
    for p in res5:
        print(f"  -> Match: {p.name} ({p.location})")

    # CASE 6: Search "pots" + Price + Quantity + Nearby Me
    res6 = SemanticMatchingEngine.match_and_rank(
        products,
        SearchRequest(
            query="pots",
            price_range="1000_3000",
            quantity_range="50_100",
            location_mode="nearby",
            user_location="Kumbakonam, Tamil Nadu",
            ai_mode=True,
        ),
        ext2,
    )
    print(f"\nCASE 6 (Combined Search + Price + Quantity + Nearby Me) Count: {len(res6)}")
    assert len(res6) > 0

    # CASE 7: No search query + No filters
    res7 = SemanticMatchingEngine.match_and_rank(products, SearchRequest(ai_mode=True))
    print(f"\nCASE 7 (All Products) Count: {len(res7)}")
    assert len(res7) == len(products)

    # CASE 8: No search query + Category Filter "Handloom"
    res8 = SemanticMatchingEngine.match_and_rank(products, SearchRequest(category="Handloom", ai_mode=True))
    print(f"\nCASE 8 (Filter Category 'Handloom') Count: {len(res8)}")
    assert len(res8) > 0

    # CASE 9: Search query with impossible filters -> 0 results state
    res9 = SemanticMatchingEngine.match_and_rank(
        products, SearchRequest(query="pots", max_price=10.0, ai_mode=True)
    )
    print(f"\nCASE 9 (Zero Results State) Count: {len(res9)}")
    assert len(res9) == 0, "CASE 9 should return 0 results"

    print("\nALL 9 SEARCH & FILTER MATRIX TEST CASES PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(test_search_cases())
