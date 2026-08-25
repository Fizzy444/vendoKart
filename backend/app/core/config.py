import json
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    APP_ENV: str = "development"
    APP_NAME: str = "artisan-commerce"
    SECRET_KEY: str = "dev-super-secret-key-change-in-production-1234567890"
    API_V1_STR: str = "/api/v1"

    # PostgreSQL Database
    POSTGRES_USER: str = "artisan"
    POSTGRES_PASSWORD: str = "artisan_dev_password"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "artisan_commerce"
    DATABASE_URL: Union[str, None] = None

    @property
    def async_database_url(self) -> str:
        if self.DATABASE_URL:
            if self.DATABASE_URL.startswith("postgresql://"):
                return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
            return self.DATABASE_URL
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # S3 / MinIO
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET: str = "artisan-media"
    S3_USE_SSL: bool = False

    # JWT
    JWT_SECRET: str = "dev-jwt-secret-key-artisan-commerce-2026-secure"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OTP & SMS Gateway (2Factor.in)
    OTP_PROVIDER: str = "2factor"
    OTP_EXPIRY_SECONDS: int = 300
    DEV_MOCK_OTP: str = "123456"

    # 2Factor.in Configuration (voice call OTP)
    TWOFACTOR_API_KEY: str = ""
    TWOFACTOR_TEMPLATE_NAME: str = "VENDOKART_OTP"

    # LLM / AI Configuration (Local / Ollama)
    LLM_BASE_URL: str = "http://localhost:11434"
    LLM_MODEL: str = "qwen2.5:7b"

    # External APIs (Optional)
    GOOGLE_MAPS_API_KEY: str = ""
    WHATSAPP_API_URL: str = ""
    WHATSAPP_ACCESS_TOKEN: str = ""
    SENTRY_DSN: str = ""

    # Groq AI Configurations (§10, §11)
    GROQ_API_KEY_20B: str = ""
    GROQ_API_KEY_120B: str = ""
    GROQ_API_KEY: str = ""

    # Role-based Model Architecture
    MODEL_PRICING_EXPLANATION: str = "openai/gpt-oss-20b"
    MODEL_NEGOTIATION_AGENT: str = "openai/gpt-oss-120b"
    MODEL_SUSPICIOUS_DATA_REASONING: str = "openai/gpt-oss-20b"
    MODEL_VOICE_STT: str = "whisper-large-v3-turbo"
    MODEL_MARKET_INFO: str = "groq/compound"

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        elif isinstance(v, list):
            return v
        return []


settings = Settings()
