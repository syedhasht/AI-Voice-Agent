from fastapi import APIRouter, Request
from fastapi.responses import Response

TWIML_XML = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="en-US">
    System active. AI Voice Agent ready.
  </Say>
</Response>"""

router = APIRouter(prefix="/twilio", tags=["Twilio"])


@router.get("/inbound")
@router.post("/inbound")
async def twilio_inbound(request: Request):
    return Response(
        content=TWIML_XML,
        media_type="application/xml",
    )
