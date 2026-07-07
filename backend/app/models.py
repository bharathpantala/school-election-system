from datetime import datetime
import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class ElectionType(str, enum.Enum):
    spl = "SCHOOL_STUDENT_LEADER"
    class_leader = "CLASS_LEADER"
    playtime_leader = "PLAYTIME_LEADER"
    event_organizer_leader = "EVENT_ORGANIZER_LEADER"


class ElectionStatus(str, enum.Enum):
    open = "OPEN"
    closed = "CLOSED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(80), nullable=True)
    last_name = Column(String(80), nullable=True)
    username = Column(String(80), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    votes = relationship("Vote", back_populates="user", cascade="all, delete-orphan")


class Election(Base):
    __tablename__ = "elections"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    election_type = Column(Enum(ElectionType), nullable=False)
    status = Column(Enum(ElectionStatus), default=ElectionStatus.open, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    candidates = relationship("Candidate", back_populates="election", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="election", cascade="all, delete-orphan")


class Candidate(Base):
    __tablename__ = "candidates"
    __table_args__ = (
        UniqueConstraint("election_id", "ballot_number", name="uq_candidate_election_ballot_number"),
    )

    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey("elections.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(140), nullable=False)
    symbol = Column(String(20), nullable=False)
    ballot_number = Column(Integer, nullable=False)
    class_name = Column(String(60), nullable=True)

    election = relationship("Election", back_populates="candidates")
    votes = relationship("Vote", back_populates="candidate", cascade="all, delete-orphan")


class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey("elections.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    election = relationship("Election", back_populates="votes")
    candidate = relationship("Candidate", back_populates="votes")
    user = relationship("User", back_populates="votes")
