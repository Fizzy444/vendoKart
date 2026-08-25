# Artisan Commerce Backend

FastAPI asynchronous REST API with PostgreSQL (SQLAlchemy 2.0 async + asyncpg) and Redis integration.

## Local Development

1. Activate virtual environment:
   ```bash
   # Windows
   .venv\Scripts\activate

   # Linux / macOS
   source .venv/bin/activate
   ```

2. Run the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

3. Access interactive Swagger API documentation:
   - [http://localhost:8000/docs](http://localhost:8000/docs)
   - [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

## Running Tests

```bash
pytest
```
