from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.models import MeetingStatus, MeetingType, ParticipantRole

# User Schemas
class UserBase(BaseModel):
    name: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Participant Schemas
class ParticipantJoin(BaseModel):
    display_name: str

class ParticipantLeave(BaseModel):
    display_name: Optional[str] = None

class ParticipantResponse(BaseModel):
    id: int
    meeting_id: int
    user_id: Optional[int] = None
    display_name: str
    role: ParticipantRole
    joined_at: datetime
    left_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# Meeting Schemas
class MeetingCreate(BaseModel):
    title: str = "Instant Meeting"
    description: Optional[str] = None
    duration_minutes: int = 60

class MeetingSchedule(MeetingCreate):
    scheduled_at: datetime

class MeetingResponse(BaseModel):
    id: int
    meeting_code: str
    host_id: int
    title: str
    description: Optional[str] = None
    meeting_type: MeetingType
    scheduled_at: Optional[datetime] = None
    duration_minutes: int
    status: MeetingStatus
    created_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class MeetingDetailResponse(MeetingResponse):
    host: Optional[UserResponse] = None
    participants: List[ParticipantResponse] = []

    model_config = ConfigDict(from_attributes=True)

# LiveKit Token Schemas
class TokenRequest(BaseModel):
    display_name: str
    identity: Optional[str] = None

class TokenResponse(BaseModel):
    token: str
    server_url: str
    room_name: str
    identity: str
    display_name: str
    is_host: bool
