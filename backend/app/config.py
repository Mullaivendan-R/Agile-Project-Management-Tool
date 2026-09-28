from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "Agile Project Management Tool"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite:///./agile_pm.db"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    # Background worker settings
    WORKER_INTERVAL_SECONDS: int = 60
    TASK_DUE_SOON_HOURS: int = 24

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
