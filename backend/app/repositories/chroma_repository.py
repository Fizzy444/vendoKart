import os
import logging
from typing import List, Optional, Tuple, Dict, Mapping, Any
import chromadb
from chromadb import Collection
from chromadb.api import ClientAPI
from chromadb.config import Settings as ChromaSettings

from app.schemas.search import ProductItem
from ai.matching.bge_embedder import BGEEmbeddingEngine

logger = logging.getLogger("artisan.chroma_repository")


class ChromaRepository:
    """
    Persistent ChromaDB vector repository for artisan craft products.
    Stores BGE-M3 vector embeddings, document text, and full structured metadata.
    Provides idempotent migration, vector similarity retrieval, and CRUD access.
    """

    _client: Optional[ClientAPI] = None
    _collection: Optional[Collection] = None
    _DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "chromadb_data"))
    _COLLECTION_NAME = "artisan_products"

    @classmethod
    def get_client(cls) -> ClientAPI:
        if cls._client is None:
            os.makedirs(cls._DATA_PATH, exist_ok=True)
            try:
                cls._client = chromadb.PersistentClient(
                    path=cls._DATA_PATH,
                    settings=ChromaSettings(anonymized_telemetry=False)
                )
            except BaseException as e:
                logger.warning(f"Error initializing ChromaDB PersistentClient: {e}. Purging corrupted data directory.")
                import shutil
                if os.path.exists(cls._DATA_PATH):
                    try:
                        shutil.rmtree(cls._DATA_PATH)
                    except Exception:
                        pass
                os.makedirs(cls._DATA_PATH, exist_ok=True)
                cls._client = chromadb.PersistentClient(
                    path=cls._DATA_PATH,
                    settings=ChromaSettings(anonymized_telemetry=False)
                )
        return cls._client

    @classmethod
    def get_collection(cls) -> Collection:
        if cls._collection is None:
            client = cls.get_client()
            cls._collection = client.get_or_create_collection(
                name=cls._COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
        return cls._collection

    @classmethod
    def _product_to_text(cls, p: ProductItem) -> str:
        """Constructs text document representation of product for BGE-M3 embedding."""
        return f"{p.name}. {p.description} Category: {p.category}. Craft Type: {p.craft_type}. Location: {p.location}."

    @classmethod
    def _product_to_metadata(cls, p: ProductItem) -> Dict[str, Any]:
        """Converts ProductItem model into primitive metadata dictionary for ChromaDB."""
        return {
            "id": p.id,
            "name": p.name,
            "artisan_name": p.artisan_name,
            "is_verified_artisan": p.is_verified_artisan,
            "location": p.location,
            "category": p.category,
            "price": p.price,
            "price_per_unit": p.price_per_unit if p.price_per_unit is not None else 0.0,
            "min_order_qty": p.min_order_qty,
            "delivery_days": p.delivery_days,
            "production_capacity_per_day": p.production_capacity_per_day,
            "shipping_days": p.shipping_days,
            "lead_time_days": p.lead_time_days,
            "image_url": p.image_url,
            "description": p.description,
            "craft_type": p.craft_type,
            "rating": p.rating,
            "stock": p.stock,
            "is_favorite": p.is_favorite,
        }

    @classmethod
    def _metadata_to_product(cls, m: Mapping[str, Any]) -> ProductItem:
        """Reconstructs native ProductItem Pydantic model from ChromaDB metadata."""
        def _to_float(v: Any, default: float) -> float:
            return float(v) if isinstance(v, (int, float, str)) else default

        def _to_int(v: Any, default: int) -> int:
            return int(v) if isinstance(v, (int, float, str)) else default

        def _to_str(v: Any, default: str = "") -> str:
            return str(v) if v is not None else default

        def _to_bool(v: Any, default: bool = False) -> bool:
            return bool(v) if v is not None else default

        return ProductItem(
            id=_to_str(m.get("id")),
            name=_to_str(m.get("name")),
            artisan_name=_to_str(m.get("artisan_name")),
            is_verified_artisan=_to_bool(m.get("is_verified_artisan"), True),
            location=_to_str(m.get("location")),
            category=_to_str(m.get("category")),
            price=_to_float(m.get("price"), 0.0),
            price_per_unit=_to_float(m.get("price_per_unit"), 0.0),
            min_order_qty=_to_int(m.get("min_order_qty"), 1),
            delivery_days=_to_int(m.get("delivery_days"), 1),
            production_capacity_per_day=_to_int(m.get("production_capacity_per_day"), 10),
            shipping_days=_to_int(m.get("shipping_days"), 1),
            lead_time_days=_to_int(m.get("lead_time_days"), 0),
            image_url=_to_str(m.get("image_url")),
            description=_to_str(m.get("description")),
            craft_type=_to_str(m.get("craft_type")),
            rating=_to_float(m.get("rating"), 5.0),
            stock=_to_int(m.get("stock"), 0),
            is_favorite=_to_bool(m.get("is_favorite"), False),
        )

    @classmethod
    async def initialize_and_migrate(cls, seed_products: List[ProductItem]) -> int:
        """
        Idempotently migrates/upserts seed products into ChromaDB with BGE-M3 embeddings.
        Verifies record count preservation.
        """
        collection = cls.get_collection()
        logger.info(f"Initializing ChromaDB persistent storage at {cls._DATA_PATH}...")

        ids = []
        documents = []
        metadatas = []
        embeddings = []

        for p in seed_products:
            doc_text = cls._product_to_text(p)
            vec = BGEEmbeddingEngine.get_embedding(doc_text)
            
            ids.append(p.id)
            documents.append(doc_text)
            metadatas.append(cls._product_to_metadata(p))
            embeddings.append(vec)

        # Idempotent upsert into ChromaDB
        collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
            embeddings=embeddings,
        )

        chroma_count = collection.count()
        logger.info(f"ChromaDB Migration Complete. Original Seed Count: {len(seed_products)}, ChromaDB Count: {chroma_count}")
        return chroma_count

    @classmethod
    async def get_all_products(cls) -> List[ProductItem]:
        """Retrieves all product items from ChromaDB collection."""
        collection = cls.get_collection()
        res = collection.get(include=["metadatas"])
        metadatas = res.get("metadatas") or []
        if not metadatas:
            return []
        
        products = [cls._metadata_to_product(m) for m in metadatas]
        # Sort predictably by ID
        products.sort(key=lambda p: p.id)
        return products

    @classmethod
    async def get_product_by_id(cls, product_id: str) -> Optional[ProductItem]:
        """Finds product by unique ID from ChromaDB."""
        collection = cls.get_collection()
        res = collection.get(ids=[product_id], include=["metadatas"])
        metadatas = res.get("metadatas") or []
        if len(metadatas) > 0:
            return cls._metadata_to_product(metadatas[0])
        return None

    @classmethod
    async def toggle_favorite(cls, product_id: str) -> Optional[ProductItem]:
        """Toggles is_favorite status of a product in ChromaDB."""
        collection = cls.get_collection()
        product = await cls.get_product_by_id(product_id)
        if not product:
            return None

        product.is_favorite = not product.is_favorite
        # Update metadata in ChromaDB
        meta = cls._product_to_metadata(product)
        collection.update(ids=[product_id], metadatas=[meta])
        return product

    @classmethod
    async def query_semantic_vector(cls, query_vector: List[float], n_results: int = 10) -> List[Tuple[ProductItem, float]]:
        """Queries ChromaDB vector collection using BGE-M3 query vector."""
        collection = cls.get_collection()
        total_count = collection.count()
        if total_count == 0:
            return []

        limit = min(n_results, total_count)
        results = collection.query(
            query_embeddings=[query_vector],
            n_results=limit,
            include=["metadatas", "distances"]
        )

        matched: List[Tuple[ProductItem, float]] = []
        metadatas = results.get("metadatas")
        distances = results.get("distances")
        metadatas_list = metadatas[0] if metadatas and len(metadatas) > 0 else []
        distances_list = distances[0] if distances and len(distances) > 0 else []

        for meta, dist in zip(metadatas_list, distances_list):
            prod = cls._metadata_to_product(meta)
            # Convert cosine distance to similarity score (cosine distance = 1 - cosine_sim)
            similarity = max(0.0, 1.0 - float(dist))
            matched.append((prod, similarity))

        return matched
