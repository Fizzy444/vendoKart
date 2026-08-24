import asyncio
import os
from typing import Any, Dict
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Set test environment
os.environ["APP_ENV"] = "development"
os.environ["DEV_MOCK_OTP"] = "123456"
os.environ["JWT_SECRET"] = "test-jwt-secret-key-123456"

from app.main import app
from app.core.database import db_state


class MockMongoCursor:
    def __init__(self, docs):
        self._docs = list(docs)
        self._skip = 0
        self._limit = len(self._docs)

    def skip(self, n: int):
        self._skip = n
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    def __aiter__(self):
        self._iter = iter(self._docs[self._skip : self._skip + self._limit])
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration


class MockMongoCollection:
    def __init__(self):
        self.docs = {}

    async def create_index(self, *args, **kwargs):
        return True

    async def insert_one(self, doc):
        from bson import ObjectId
        doc_id = doc.get("_id") or ObjectId()
        doc_copy = dict(doc)
        doc_copy["_id"] = doc_id
        self.docs[str(doc_id)] = doc_copy

        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id

        return InsertResult(doc_id)

    async def find_one(self, query):
        for doc in self.docs.values():
            match = True
            for k, v in query.items():
                if k == "_id":
                    if str(doc.get("_id")) != str(v):
                        match = False
                        break
                elif doc.get(k) != v:
                    match = False
                    break
            if match:
                return doc
        return None

    def find(self, query=None):
        if not query:
            return MockMongoCursor(list(self.docs.values()))
        matched = []
        for doc in self.docs.values():
            match = True
            for k, v in query.items():
                if k == "_id":
                    if str(doc.get("_id")) != str(v):
                        match = False
                        break
                elif doc.get(k) != v:
                    match = False
                    break
            if match:
                matched.append(doc)
        return MockMongoCursor(matched)

    async def update_one(self, query, update):
        target = await self.find_one(query)
        if target:
            if "$set" in update:
                target.update(update["$set"])
            return True
        return False

    async def find_one_and_update(self, query, update, return_document=True):
        target = await self.find_one(query)
        if target:
            if "$set" in update:
                target.update(update["$set"])
            return target
        return None


class MockDatabase:
    def __init__(self):
        self._collections: Dict[str, MockMongoCollection] = {}
        self.admin = self

    def __getattr__(self, name: str) -> MockMongoCollection:
        if name not in self._collections:
            self._collections[name] = MockMongoCollection()
        return self._collections[name]

    def __getitem__(self, name: str) -> MockMongoCollection:
        return getattr(self, name)

    async def command(self, cmd):
        return {"ok": 1}


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def mock_db():
    mock = MockDatabase()
    db_state.db = mock
    yield mock


@pytest_asyncio.fixture
async def async_client(mock_db):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
