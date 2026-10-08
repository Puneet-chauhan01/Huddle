import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app.models import models
from app.models.models import User, Meeting, MeetingParticipant, MeetingStatus, MeetingType, ParticipantRole

def seed_db():
    """
    Idempotently seeds the database with initial sample data for demonstration.
    Safe to run repeatedly on startup or deployment without duplicating records.
    """
    # Ensure database schema is created
    models.Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # 1. Idempotent Default Host User
        default_user = db.query(User).filter(User.email == "puneet@example.com").first()
        if not default_user:
            default_user = User(
                name="Puneet Chauhan",
                email="puneet@example.com",
            )
            db.add(default_user)
            db.commit()
            db.refresh(default_user)
            print("[Seed] Created default user: Puneet Chauhan")
        else:
            print("[Seed] Default user already exists.")

        now = datetime.utcnow()

        # 2. Idempotent Upcoming Meetings
        sample_upcoming = [
            {
                "meeting_code": "84239176205",
                "title": "Product Design Sync",
                "scheduled_at": now + timedelta(hours=2),
                "duration_minutes": 45,
                "status": MeetingStatus.scheduled,
            },
            {
                "meeting_code": "91655301182",
                "title": "Weekly Engineering Standup",
                "scheduled_at": now + timedelta(days=1),
                "duration_minutes": 30,
                "status": MeetingStatus.scheduled,
            },
        ]

        for s in sample_upcoming:
            exists = db.query(Meeting).filter(Meeting.meeting_code == s["meeting_code"]).first()
            if not exists:
                m = Meeting(
                    meeting_code=s["meeting_code"],
                    host_id=default_user.id,
                    title=s["title"],
                    meeting_type=MeetingType.scheduled,
                    scheduled_at=s["scheduled_at"],
                    duration_minutes=s["duration_minutes"],
                    status=s["status"],
                )
                db.add(m)
                print(f"[Seed] Created upcoming meeting: {s['title']} ({s['meeting_code']})")
            else:
                print(f"[Seed] Upcoming meeting already exists: {s['title']} ({s['meeting_code']})")

        # 3. Idempotent Recent Meeting
        recent_code = "27188463094"
        recent_meeting = db.query(Meeting).filter(Meeting.meeting_code == recent_code).first()
        if not recent_meeting:
            recent_meeting = Meeting(
                meeting_code=recent_code,
                host_id=default_user.id,
                title="Sprint Retrospective",
                meeting_type=MeetingType.scheduled,
                scheduled_at=now - timedelta(days=1, hours=2),
                duration_minutes=55,
                status=MeetingStatus.ended,
                ended_at=now - timedelta(days=1, hours=1),
            )
            db.add(recent_meeting)
            db.commit()
            db.refresh(recent_meeting)

            part1 = MeetingParticipant(
                meeting_id=recent_meeting.id,
                user_id=default_user.id,
                display_name=default_user.name,
                role=ParticipantRole.host,
                joined_at=recent_meeting.scheduled_at,
                left_at=recent_meeting.ended_at,
            )
            part2 = MeetingParticipant(
                meeting_id=recent_meeting.id,
                display_name="Maya Patel",
                role=ParticipantRole.participant,
                joined_at=recent_meeting.scheduled_at,
                left_at=recent_meeting.ended_at,
            )
            db.add_all([part1, part2])
            print(f"[Seed] Created recent meeting: Sprint Retrospective ({recent_code})")
        else:
            print(f"[Seed] Recent meeting already exists: Sprint Retrospective ({recent_code})")

        db.commit()
        print("[Seed] Idempotent seed completed successfully.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
