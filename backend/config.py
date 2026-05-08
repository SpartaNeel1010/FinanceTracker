from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str
    openai_api_key: str
    jwt_secret: str = "spendsense-secret-key"
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = 60 * 24 * 7  # 7 days

    model_config = {
        "env_file": [".env", "../.env"],
        "env_file_encoding": "utf-8",
        "extra": "allow",
    }


@lru_cache()
def get_settings():
    return Settings()
