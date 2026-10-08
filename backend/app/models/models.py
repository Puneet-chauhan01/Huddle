from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class MeetingStatus(str, enum.Enum):
    scheduled = "scheduled"
    active = "active"
    ended = "ended"
    cancelled = "cancelled"

class MeetingType(str, enum.Enum):
    instant = "instant"
    scheduled = "scheduled"

class ParticipantRole(str, enum.Enum):
    host = "host"
    participant = "participant"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    meetings = relationship("Meeting", back_populates="host")
    participations = relationship("MeetingParticipant", back_populates="user")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    meeting_code = Column(String, unique=True, index=True, nullable=False)
    host_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    meeting_type = Column(Enum(MeetingType), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=True, index=True)
    duration_minutes = Column(Integer, CheckConstraint('duration_minutes > 0'), nullable=False)
    status = Column(Enum(MeetingStatus), default=MeetingStatus.scheduled, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)

    host = relationship("User", back_populates="meetings")
    participants = relationship("MeetingParticipant", back_populates="meeting", cascade="all, delete-orphan")


class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    display_name = Column(String, nullable=False)
    role = Column(Enum(ParticipantRole), default=ParticipantRole.participant, nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    left_at = Column(DateTime(timezone=True), nullable=True)

    meeting = relationship("Meeting", back_populates="participants")
    user = relationship("User", back_populates="participations")
