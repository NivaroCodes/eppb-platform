from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str | None = None
    postgres_user: str | None = None
    postgres_password: str | None = None
    postgres_db: str | None = None
    postgres_host: str = "db"
    postgres_port: int = 5432
    secret_key: str = "change_me"
    app_env: str = "development"

    def get_database_url(self) -> str:
        if self.database_url:
            # Railway exposes postgres://, SQLAlchemy asyncpg needs postgresql+asyncpg://
            if self.database_url.startswith("postgres://"):
                return self.database_url.replace("postgres://", "postgresql+asyncpg://", 1)
            if self.database_url.startswith("postgresql://"):
                return self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return self.database_url
            
        return (
            f"postgresql+asyncpg://{self.postgres_user}:"
            f"{self.postgres_password}@{self.postgres_host}:"
            f"{self.postgres_port}/{self.postgres_db}"
        )

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()