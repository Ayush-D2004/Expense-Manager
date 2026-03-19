import hmac
import hashlib
import httpx
import base64
from app.config import get_settings

settings = get_settings()

RAZORPAY_API = "https://api.razorpay.com/v1"


def _auth_header() -> str:
    token = base64.b64encode(
        f"{settings.RAZORPAY_KEY_ID}:{settings.RAZORPAY_KEY_SECRET}".encode()
    ).decode()
    return f"Basic {token}"


def create_razorpay_order(amount_paise: int, currency: str, receipt: str) -> dict:
    with httpx.Client() as client:
        response = client.post(
            f"{RAZORPAY_API}/orders",
            json={
                "amount": amount_paise,
                "currency": currency,
                "receipt": receipt,
                "payment_capture": 1,
            },
            headers={"Authorization": _auth_header()},
            timeout=10.0,
        )
        response.raise_for_status()
        return response.json()


def verify_razorpay_payment(order_id: str, payment_id: str, signature: str) -> bool:
    message = f"{order_id}|{payment_id}"
    generated = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(generated, signature)
