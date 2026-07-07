from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/school_election_db"
    secret_key: str = "change_this_secret_key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 180
    frontend_origin: str = "http://localhost:5173"
    admin_signup_code: str = "school_admin_allow_signup"
    kiosk_vote_gap_seconds: int = 3

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
