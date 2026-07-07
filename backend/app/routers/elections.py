from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_admin
from app.models import Candidate, Election, ElectionStatus, ElectionType, User, Vote
from app.schemas import (
    CandidateCreateRequest,
    CandidateResponse,
    CandidateResult,
    ElectionCreateRequest,
    ElectionResponse,
    ElectionResultResponse,
    ElectionUpdateRequest,
    VoteRequest,
    VoteResponse,
)


router = APIRouter(tags=["elections"])


@router.get("/election-types", response_model=list[str])
def get_election_types():
    return [
        ElectionType.spl.value,
        ElectionType.class_leader.value,
        ElectionType.playtime_leader.value,
        ElectionType.event_organizer_leader.value,
    ]


@router.post("/elections", response_model=ElectionResponse, status_code=status.HTTP_201_CREATED)
def create_election(
    payload: ElectionCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    election = Election(title=payload.title, election_type=payload.election_type)
    db.add(election)
    db.commit()
    db.refresh(election)
    return election


@router.get("/elections", response_model=list[ElectionResponse])
def list_elections(status_filter: ElectionStatus | None = None, db: Session = Depends(get_db)):
    query = db.query(Election).order_by(Election.created_at.desc())
    if status_filter:
        query = query.filter(Election.status == status_filter)
    return query.all()


@router.put("/elections/{election_id}", response_model=ElectionResponse)
def update_election(
    election_id: int,
    payload: ElectionUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    if payload.title is not None:
        election.title = payload.title
    if payload.status is not None:
        election.status = payload.status

    db.commit()
    db.refresh(election)
    return election


@router.post("/elections/{election_id}/candidates", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
def add_candidate(
    election_id: int,
    payload: CandidateCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    if election.status == ElectionStatus.closed:
        raise HTTPException(status_code=400, detail="Cannot add candidates to a closed election")

    existing = (
        db.query(Candidate)
        .filter(Candidate.election_id == election_id, Candidate.ballot_number == payload.ballot_number)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Ballot number already used in this election")

    candidate = Candidate(
        election_id=election_id,
        name=payload.name,
        symbol=payload.symbol,
        ballot_number=payload.ballot_number,
        class_name=payload.class_name,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.get("/elections/{election_id}/candidates", response_model=list[CandidateResponse])
def list_candidates(election_id: int, db: Session = Depends(get_db)):
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    return (
        db.query(Candidate)
        .filter(Candidate.election_id == election_id)
        .order_by(Candidate.ballot_number.asc())
        .all()
    )


@router.post("/elections/{election_id}/vote", response_model=VoteResponse)
def cast_vote(
    election_id: int,
    payload: VoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    if election.status != ElectionStatus.open:
        raise HTTPException(status_code=400, detail="Election is closed")

    candidate = (
        db.query(Candidate)
        .filter(Candidate.id == payload.candidate_id, Candidate.election_id == election_id)
        .first()
    )
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found in this election")

    vote = Vote(election_id=election_id, candidate_id=candidate.id, user_id=current_user.id)
    db.add(vote)
    db.commit()

    return VoteResponse(message="Vote submitted successfully")


@router.get("/elections/{election_id}/results", response_model=ElectionResultResponse)
def election_results(election_id: int, db: Session = Depends(get_db)):
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    rows = (
        db.query(
            Candidate.id,
            Candidate.name,
            Candidate.symbol,
            Candidate.ballot_number,
            func.count(Vote.id).label("vote_count"),
        )
        .outerjoin(Vote, Vote.candidate_id == Candidate.id)
        .filter(Candidate.election_id == election_id)
        .group_by(Candidate.id)
        .order_by(func.count(Vote.id).desc(), Candidate.ballot_number.asc())
        .all()
    )

    candidates = [
        CandidateResult(
            candidate_id=row[0],
            candidate_name=row[1],
            symbol=row[2],
            ballot_number=row[3],
            vote_count=row[4],
        )
        for row in rows
    ]

    total_votes = sum(item.vote_count for item in candidates)
    return ElectionResultResponse(
        election_id=election.id,
        election_title=election.title,
        election_type=election.election_type,
        total_votes=total_votes,
        candidates=candidates,
    )
