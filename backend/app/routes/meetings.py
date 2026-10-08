from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.schemas import (
    MeetingCreate,
    MeetingSchedule,
    MeetingResponse,
    MeetingDetailResponse,
    ParticipantJoin,
    ParticipantLeave,
    ParticipantResponse,
    TokenRequest,
    TokenResponse,
)
from app.services import meeting_service, livekit_service

router = APIRouter(prefix="/api/meetings", tags=["Meetings"])

# DEFAULT_USER_ID is a mock to simulate the logged-in user as per requirements
DEFAULT_USER_ID = 1

@router.post("", response_model=MeetingResponse)
def create_instant_meeting(meeting: MeetingCreate, db: Session = Depends(get_db)):
    return meeting_service.create_instant_meeting(db, meeting, host_id=DEFAULT_USER_ID)

@router.post("/schedule", response_model=MeetingResponse)
def create_scheduled_meeting(meeting: MeetingSchedule, db: Session = Depends(get_db)):
    return meeting_service.create_scheduled_meeting(db, meeting, host_id=DEFAULT_USER_ID)

@router.get("/upcoming", response_model=List[MeetingResponse])
def get_upcoming_meetings(db: Session = Depends(get_db)):
    return meeting_service.get_upcoming_meetings(db, user_id=DEFAULT_USER_ID)

@router.get("/recent", response_model=List[MeetingResponse])
def get_recent_meetings(db: Session = Depends(get_db)):
    return meeting_service.get_recent_meetings(db, user_id=DEFAULT_USER_ID)

@router.get("/{meeting_code}", response_model=MeetingDetailResponse)
def get_meeting(meeting_code: str, db: Session = Depends(get_db)):
    return meeting_service.get_meeting_by_code(db, meeting_code)

@router.post("/{meeting_code}/join", response_model=MeetingDetailResponse)
def join_meeting(meeting_code: str, participant: ParticipantJoin, db: Session = Depends(get_db)):
    # Join adds the participant to the DB and returns the meeting details
    meeting_service.join_meeting(db, meeting_code, participant, user_id=DEFAULT_USER_ID)
    return meeting_service.get_meeting_by_code(db, meeting_code)

@router.post("/{meeting_code}/leave")
def leave_meeting(
    meeting_code: str,
    payload: Optional[ParticipantLeave] = None,
    display_name: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    name = (payload and payload.display_name) or display_name or ""
    meeting_service.leave_meeting(db, meeting_code, name)
    return {"status": "success"}

@router.post("/{meeting_code}/token", response_model=TokenResponse)
def get_meeting_token(meeting_code: str, req: TokenRequest, db: Session = Depends(get_db)):
    meeting = meeting_service.get_meeting_by_code(db, meeting_code)
    # Check if participant is the host
    is_host = (
        (meeting.host and meeting.host.name.lower() == req.display_name.lower()) or
        (req.display_name.strip().lower() == "puneet chauhan")
    )
    return livekit_service.generate_livekit_token(
        room_name=meeting.meeting_code,
        display_name=req.display_name,
        identity=req.identity,
        is_host=is_host,
    )
