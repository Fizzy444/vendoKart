import os
from typing import Optional
from groq import Groq

from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Model names mapped strictly according to system architecture
MODEL_PRICING_EXPLANATION = os.getenv("MODEL_PRICING_EXPLANATION", "openai/gpt-oss-20b")
MODEL_NEGOTIATION_AGENT = os.getenv("MODEL_NEGOTIATION_AGENT", "openai/gpt-oss-120b")
MODEL_SUSPICIOUS_DATA_REASONING = os.getenv("MODEL_SUSPICIOUS_DATA_REASONING", "openai/gpt-oss-20b")
MODEL_VOICE_STT = os.getenv("MODEL_VOICE_STT", "whisper-large-v3-turbo")
MODEL_MARKET_INFO = os.getenv("MODEL_MARKET_INFO", "groq/compound")


def get_groq_api_key_for_role(role: str) -> str:
    """
    Returns the appropriate Groq API key based on the role and model requirements.
    - Negotiation Agent (120b): Uses 120b key for deep tactical multi-turn reasoning.
    - Pricing Explanation, Suspicious Data Reasoning, STT, Market: Uses 20b key.
    """
    role_lower = role.lower()
    if role_lower in ("negotiation", "negotiate", "120b", "openai/gpt-oss-120b"):
        return os.getenv("GROQ_API_KEY_120B", os.getenv("GROQ_API_KEY", ""))
    elif role_lower in ("pricing", "explainer", "suspicious", "fraud", "20b", "openai/gpt-oss-20b"):
        return os.getenv("GROQ_API_KEY_20B", os.getenv("GROQ_API_KEY", ""))
    elif role_lower in ("stt", "speech", "whisper", "whisper-large-v3-turbo"):
        return os.getenv("GROQ_API_KEY_20B", os.getenv("GROQ_API_KEY", ""))
    elif role_lower in ("market", "compound", "groq/compound"):
        return os.getenv("GROQ_API_KEY_20B", os.getenv("GROQ_API_KEY", ""))
    
    # Generic fallback
    return os.getenv("GROQ_API_KEY", os.getenv("GROQ_API_KEY_20B", ""))


def get_groq_client(role: str = "default", api_key: Optional[str] = None) -> Groq:
    """
    Creates and returns an authenticated Groq client instance for the requested role.
    """
    key = api_key or get_groq_api_key_for_role(role)
    return Groq(api_key=key)
