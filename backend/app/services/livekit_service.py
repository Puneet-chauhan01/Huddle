import os
import time
import uuid
import json
import jwt
from typing import Optional

def get_livekit_settings():
    """Retrieve LiveKit configuration dynamically from environment variables."""
    api_key = os.getenv("LIVEKIT_API_KEY", "devkey")
    api_secret = os.getenv("LIVEKIT_API_SECRET", "secret")
    server_url = os.getenv("LIVEKIT_URL", "ws://127.0.0.1:7880")
    return api_key, api_secret, server_url

def generate_livekit_token(
    room_name: str,
    display_name: str,
    identity: Optional[str] = None,
    is_host: bool = False,
    metadata: Optional[dict] = None
) -> dict:
    """
    Generate a signed JWT token for connecting to LiveKit SFU.
    Works for both LiveKit Cloud in production and local LiveKit server during development.
    """
    api_key, api_secret, livekit_url = get_livekit_settings()

    if not identity:
        identity = f"{display_name.lower().replace(' ', '_')}_{uuid.uuid4().hex[:6]}"

    now = int(time.time())
    meta = metadata or {}
    meta.update({
        "is_host": is_host,
        "display_name": display_name,
    })

    video_grant = {
        "room": room_name,
        "roomJoin": True,
        "canPublish": True,
        "canSubscribe": True,
        "canPublishData": True,
    }
    if is_host:
        video_grant["roomAdmin"] = True
        video_grant["roomRecord"] = True

    payload = {
        "sub": identity,
        "iss": api_key,
        "nbf": now - 10,
        "exp": now + 86400,  # 24 hours
        "name": display_name,
        "metadata": json.dumps(meta),
        "video": video_grant,
    }

    token = jwt.encode(payload, api_secret, algorithm="HS256")
    if isinstance(token, bytes):
        token = token.decode("utf-8")

    return {
        "token": token,
        "server_url": livekit_url,
        "room_name": room_name,
        "identity": identity,
        "display_name": display_name,
        "is_host": is_host,
    }
