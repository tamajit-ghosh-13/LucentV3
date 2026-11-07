import base64
import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
from typing import Optional

# Initialize FastAPI router for this pipeline
router = APIRouter(prefix="/api/visual", tags=["Visual Impairment"])

# Pydantic models for request and response validation
class VisionRequest(BaseModel):
    image_base64: str
    element_type: str  # e.g., 'svg', 'image', 'button'
    context_text: Optional[str] = ""

class VisionResponse(BaseModel):
    aria_label: str
    alt_text: str
    confidence: float

# Initialize Gemini (Make sure GEMINI_API_KEY is in your .env)
# genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

@router.post("/analyze-element", response_model=VisionResponse)
async def analyze_element(request: VisionRequest):
    """
    Receives an image crop of an unlabelled DOM element,
    queries the Gemini Vision model, and returns generated ARIA labels.
    """
    try:
        # NOTE: Uncomment and set up your API key for real inference.
        # model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        You are an expert web accessibility (a11y) AI.
        Analyze this UI element image. Element type: {request.element_type}.
        Context around element: '{request.context_text}'.
        Return ONLY a valid JSON object with the following keys:
        - "aria_label": A short, descriptive action label (e.g., "Close dialog").
        - "alt_text": A descriptive text for the image itself.
        - "confidence": A float between 0.0 and 1.0 indicating your certainty.
        """

        # --- MOCK RESPONSE FOR NOW (Replace with actual Gemini call below) ---
        # image_data = base64.b64decode(request.image_base64.split(",")[1] if "," in request.image_base64 else request.image_base64)
        # response = model.generate_content([prompt, {"mime_type": "image/png", "data": image_data}])
        # raw_text = response.text.strip().strip("```json").strip("```").strip()
        # parsed_data = json.loads(raw_text)
        
        # Mocking the AI response for testing the wire
        parsed_data = {
            "aria_label": f"Generated label for {request.element_type}",
            "alt_text": f"Generated alt text based on context: {request.context_text}",
            "confidence": 0.92
        }

        return VisionResponse(
            aria_label=parsed_data.get("aria_label", "Unlabelled Element"),
            alt_text=parsed_data.get("alt_text", "Image"),
            confidence=parsed_data.get("confidence", 0.8)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
