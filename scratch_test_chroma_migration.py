import asyncio
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.repositories.product_repository import ProductRepository
from app.repositories.chroma_repository import ChromaRepository
from ai.matching.buyer_search import SemanticMatchingEngine
from ai.orchestrator.search_extractor import SearchRequirementExtractor
from app.schemas.search import SearchRequest


async def verify_chroma_migration():
    print("=== CHROMADB MIGRATION VERIFICATION ===")

    # 1. Seed Product Count
    seed_products = ProductRepository._PRODUCTS_SEED
    seed_count = len(seed_products)
    seed_ids = sorted([p.id for p in seed_products])
    print(f"1. Original Seed Product Count: {seed_count}")
    print(f"   Seed Product IDs: {seed_ids}")

    # 2. Migration Execution
    chroma_count = await ChromaRepository.initialize_and_migrate(seed_products)
    print(f"2. ChromaDB Migrated Count: {chroma_count}")
    assert chroma_count == seed_count, f"Count mismatch! Seed={seed_count}, Chroma={chroma_count}"

    # 3. Product ID Verification
    chroma_products = await ChromaRepository.get_all_products()
    chroma_ids = sorted([p.id for p in chroma_products])
    print(f"3. ChromaDB Product IDs: {chroma_ids}")
    assert seed_ids == chroma_ids, f"ID mismatch! Seed={seed_ids}, Chroma={chroma_ids}"

    # 4. Idempotency Test (run migration again)
    re_migrated_count = await ChromaRepository.initialize_and_migrate(seed_products)
    print(f"4. Re-running migration (Idempotency Test) Count: {re_migrated_count}")
    assert re_migrated_count == seed_count, f"Idempotency failed! Re-migrated count={re_migrated_count}"

    # 5. Default Dashboard Test (Empty search query)
    all_prods_via_repo = await ProductRepository.get_all_products()
    empty_req = SearchRequest(query="", ai_mode=True)
    default_res = SemanticMatchingEngine.match_and_rank(all_prods_via_repo, empty_req, None)
    print(f"5. Default Dashboard Search (query=''): {len(default_res)} products returned (Expected 10)")
    assert len(default_res) == 10, f"Default dashboard failed! Got {len(default_res)}"

    # 6. Semantic Query Test ("35 pots")
    q1 = "35 pots"
    ext1 = SearchRequirementExtractor.extract(q1)
    req1 = SearchRequest(query=q1, ai_mode=True)
    res1 = SemanticMatchingEngine.match_and_rank(all_prods_via_repo, req1, ext1)
    print(f"6. Semantic Search '{q1}': {len(res1)} products returned")
    for p in res1:
        print(f"   - [{p.id}] {p.name} (Category: {p.category}, Price: Rs. {p.price})")
    assert len(res1) > 0 and all(p.category == "Pottery" for p in res1), "Semantic search for pots failed!"

    # 7. Constraint Query Test ("70 pots within 4 days under 3000")
    q2 = "70 pots within 4 days under 3000"
    ext2 = SearchRequirementExtractor.extract(q2)
    req2 = SearchRequest(query=q2, ai_mode=True)
    res2 = SemanticMatchingEngine.match_and_rank(all_prods_via_repo, req2, ext2)
    print(f"7. Requirement Search '{q2}': {len(res2)} products returned")
    for p in res2:
        print(f"   - [{p.id}] {p.name} (Cap/day: {p.production_capacity_per_day}, Stock: {p.stock}, Del: {p.delivery_days}d)")

    # 8. Favorite Toggle Test
    toggle_target = "prod-001"
    target_prod = await ProductRepository.get_product_by_id(toggle_target)
    assert target_prod is not None, f"Target product {toggle_target} not found"
    before_fav = target_prod.is_favorite

    updated_prod = await ProductRepository.toggle_favorite(toggle_target)
    assert updated_prod is not None, f"Failed to toggle favorite for {toggle_target}"
    after_fav = updated_prod.is_favorite
    print(f"8. Toggle Favorite Test on {toggle_target}: Before={before_fav}, After={after_fav}")
    assert before_fav != after_fav, "Toggle favorite failed!"
    # Restore original favorite status
    await ProductRepository.toggle_favorite(toggle_target)

    print("\n[SUCCESS] ALL CHROMADB MIGRATION & FUNCTIONALITY TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(verify_chroma_migration())
