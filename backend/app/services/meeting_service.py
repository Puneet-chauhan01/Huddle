from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional
from app.repositories import meeting_repo
from app.schemas.schemas import MeetingCreate, MeetingSchedule, ParticipantJoin
from app.models.models import ParticipantRole

def create_instant_meeting(db: Session, meeting: MeetingCreate, host_id: int):
    return meeting_repo.create_instant_meeting(db, meeting, host_id)

def create_scheduled_meeting(db: Session, meeting: MeetingSchedule, host_id: int):
    return meeting_repo.create_scheduled_meeting(db, meeting, host_id)

def get_upcoming_meetings(db: Session, user_id: int):
    return meeting_repo.get_upcoming_meetings(db, user_id)

def get_recent_meetings(db: Session, user_id: int):
    return meeting_repo.get_recent_meetings(db, user_id)

def get_meeting_by_code(db: Session, meeting_code: str):
    meeting = meeting_repo.get_meeting_by_code(db, meeting_code)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting

def join_meeting(db: Session, meeting_code: str, participant: ParticipantJoin, user_id: Optional[int] = None):
    meeting = get_meeting_by_code(db, meeting_code)
    # Determine role based on user_id and meeting host
    role = ParticipantRole.host if user_id == meeting.host_id else ParticipantRole.participant
    return meeting_repo.join_meeting(db, meeting.id, user_id, participant.display_name, role)

def leave_meeting(db: Session, meeting_code: str, display_name: str):
    meeting = get_meeting_by_code(db, meeting_code)
    return meeting_repo.leave_meeting(db, meeting.id, display_name)
