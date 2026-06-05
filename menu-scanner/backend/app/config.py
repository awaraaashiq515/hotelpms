import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "AI Menu Scanner API"
    DEBUG: bool = True
    # If running locally using Ollama for Qwen2-VL:
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    # If using OpenAI / Gemini APIs as backup:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    model_config = {
        "extra": "ignore",
        "env_file": ".env"
    }

settings = Settings()
