from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import Optional
from app.models.models import User, Meeting, MeetingParticipant, MeetingStatus, MeetingType, ParticipantRole
from app.schemas.schemas import MeetingCreate, MeetingSchedule, ParticipantJoin
import uuid
from datetime import datetime

def ensure_default_user(db: Session, user_id: int = 1) -> User:
    """Ensure a default user exists in the database to satisfy foreign keys."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(
            name="Puneet Chauhan",
            email="puneet@example.com",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def get_meeting_by_code(db: Session, meeting_code: str):
    return db.query(Meeting).filter(Meeting.meeting_code == meeting_code).first()

def get_upcoming_meetings(db: Session, user_id: int):
    return db.query(Meeting).filter(
        Meeting.host_id == user_id,
        Meeting.status.in_([MeetingStatus.scheduled, MeetingStatus.active])
    ).order_by(Meeting.scheduled_at.asc()).all()

def get_recent_meetings(db: Session, user_id: int):
    return db.query(Meeting).filter(
        Meeting.host_id == user_id,
        Meeting.status == MeetingStatus.ended
    ).order_by(Meeting.ended_at.desc()).all()

def create_instant_meeting(db: Session, meeting: MeetingCreate, host_id: int):
    user = ensure_default_user(db, host_id)
    meeting_code = str(uuid.uuid4()).replace("-", "")[:10]
    db_meeting = Meeting(
        meeting_code=meeting_code,
        host_id=user.id,
        title=meeting.title,
        description=meeting.description,
        meeting_type=MeetingType.instant,
        duration_minutes=meeting.duration_minutes,
        status=MeetingStatus.active,
        started_at=datetime.utcnow()
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    return db_meeting

def create_scheduled_meeting(db: Session, meeting: MeetingSchedule, host_id: int):
    user = ensure_default_user(db, host_id)
    meeting_code = str(uuid.uuid4()).replace("-", "")[:10]
    db_meeting = Meeting(
        meeting_code=meeting_code,
        host_id=user.id,
        title=meeting.title,
        description=meeting.description,
        meeting_type=MeetingType.scheduled,
        scheduled_at=meeting.scheduled_at,
        duration_minutes=meeting.duration_minutes,
        status=MeetingStatus.scheduled
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    return db_meeting

def join_meeting(db: Session, meeting_id: int, user_id: Optional[int], display_name: str, role: ParticipantRole = ParticipantRole.participant):
    participant = MeetingParticipant(
        meeting_id=meeting_id,
        user_id=user_id,
        display_name=display_name,
        role=role
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant

def leave_meeting(db: Session, meeting_id: int, display_name: str):
    participant = db.query(MeetingParticipant).filter(
        MeetingParticipant.meeting_id == meeting_id,
        MeetingParticipant.display_name == display_name,
        MeetingParticipant.left_at.is_(None)
    ).first()
    if participant:
        participant.left_at = datetime.utcnow()
        db.commit()
        db.refresh(participant)
    return participant
