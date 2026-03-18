import google.generativeai as genai
import json
import re
from app.config import get_settings

settings = get_settings()
genai.configure(api_key=settings.GEMINI_API_KEY)


async def verify_receipt(file_path: str, claimed_amount: float, description: str) -> dict:
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = f"""
You are a business expense auditor. Analyze this receipt image.
The employee claims this is for: "{description}" costing ₹{claimed_amount}.

Rules:
1. Check if the receipt looks genuine and is for a business-related purpose.
2. Check if the amount on the receipt matches ₹{claimed_amount} (allow ±5% tolerance).
3. Reject if it appears to be a personal expense (restaurant personal dinner, entertainment, etc.)

Respond ONLY with valid JSON in this exact format:
{{
  "legit": true or false,
  "reason": "Brief explanation",
  "extracted_amount": <number or null>
}}
"""

        with open(file_path, "rb") as f:
            image_data = f.read()

        import mimetypes
        mime_type, _ = mimetypes.guess_type(file_path)
        mime_type = mime_type or "image/jpeg"

        response = model.generate_content(
            [
                {"mime_type": mime_type, "data": image_data},
                prompt,
            ]
        )

        raw = response.text.strip()
        json_match = re.search(r"\{.*?\}", raw, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            return {
                "legit": bool(result.get("legit", False)),
                "reason": str(result.get("reason", "No reason provided")),
                "extracted_amount": result.get("extracted_amount"),
            }

    except Exception as e:
        return {
            "legit": False,
            "reason": f"AI verification failed: {str(e)}. Flagged for manual admin review.",
            "extracted_amount": None,
        }

    return {"legit": False, "reason": "Unexpected response from AI", "extracted_amount": None}
