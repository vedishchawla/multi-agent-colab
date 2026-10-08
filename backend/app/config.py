import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

# Determine project root path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"

class Settings(BaseSettings):
    # Gemini API Credentials (supports single key or comma-separated keys: "key1,key2,key3")
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API Key(s) from Google AI Studio")
    GEMINI_MODEL: str = Field(default="gemini-3.5-flash-lite", description="Gemini model name")

    @property
    def gemini_api_keys(self) -> list[str]:
        """Parse single key or comma-separated list of keys from GEMINI_API_KEY."""
        if not self.GEMINI_API_KEY:
            return []
        return [k.strip() for k in self.GEMINI_API_KEY.split(",") if k.strip()]

    # Groq API Credentials (free at https://console.groq.com/keys)
    GROQ_API_KEY: str = Field(default="", description="Groq API Key")
    GROQ_MODEL: str = Field(default="openai/gpt-oss-120b", description="Groq model name")

    # LLM Provider Selection: "groq", "gemini", or "auto" (auto picks first available)
    LLM_PROVIDER: str = Field(default="auto", description="Which LLM provider to use: groq, gemini, or auto")

    # Rate Limiter
    GEMINI_RATE_LIMIT_RPM: int = Field(default=12, description="Requests per minute (under 15 RPM free tier)")
    
    # Execution mode
    SIMULATION_MODE: bool = Field(default=False, description="Run offline mock simulation instead of calling live LLM")
    
    # Storage
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./collaborai.db", description="Database connection string")
    
    # Server & Networking
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)
    ENVIRONMENT: str = Field(default="development")
    
    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH) if ENV_PATH.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
