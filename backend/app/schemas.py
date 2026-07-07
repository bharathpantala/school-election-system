from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models import ElectionStatus, ElectionType


class SignupRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    username: str = Field(min_length=3, max_length=80)
    password: str = Field(min_length=6, max_length=128)
    admin_permission_code: str = Field(min_length=4, max_length=200)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    first_name: Optional[str]
    last_name: Optional[str]
    username: str
    is_admin: bool

    class Config:
        from_attributes = True


class ElectionCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    election_type: ElectionType


class ElectionUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=200)
    status: Optional[ElectionStatus] = None


class ElectionResponse(BaseModel):
    id: int
    title: str
    election_type: ElectionType
    status: ElectionStatus
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=140)
    symbol: str = Field(min_length=1, max_length=20)
    ballot_number: int = Field(ge=1, le=999)
    class_name: Optional[str] = Field(default=None, max_length=60)


class CandidateResponse(BaseModel):
    id: int
    election_id: int
    name: str
    symbol: str
    ballot_number: int
    class_name: Optional[str]

    class Config:
        from_attributes = True


class VoteRequest(BaseModel):
    candidate_id: int


class VoteResponse(BaseModel):
    message: str


class CandidateResult(BaseModel):
    candidate_id: int
    candidate_name: str
    symbol: str
    ballot_number: int
    vote_count: int


class ElectionResultResponse(BaseModel):
    election_id: int
    election_title: str
    election_type: ElectionType
    total_votes: int
    candidates: list[CandidateResult]
