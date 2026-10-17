import json
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "EduPilot Institute Operations & Copilot"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "default_secret_key_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    INSTITUTE_TIMEZONE: str = "Asia/Kolkata"

    # Administrator Root Credentials (loaded from environment)
    ADMIN_EMAIL: str = "admin@edupilot.io"
    ADMIN_PASSWORD: str = "admin123"

    DATABASE_URL: str = "postgresql+asyncpg://edupilot_user:edupilot_password@localhost:5432/edupilot"

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # Ollama / Local Embedding Settings
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_EMBEDDING_MODEL: str = "qwen3-embedding:4b"

    # RAG Retrieval Settings
    RAG_SIMILARITY_THRESHOLD: float = 0.40
    RAG_TOP_K: int = 4

    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """
        Accept any of:
          - A Python list (already parsed)           → ["http://..."]
          - A JSON array string from .env            → '["http://..."]'
          - A comma-separated string from .env       → 'http://..., http://...'
        Always falls back to localhost dev origins on any parse error.
        """
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [o.strip() for o in parsed if o.strip()]
                except json.JSONDecodeError:
                    pass
            # Comma-separated fallback
            return [o.strip() for o in v.split(",") if o.strip()]
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
