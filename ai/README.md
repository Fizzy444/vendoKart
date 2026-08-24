# AI Modules Scaffold

This directory houses the intelligent agent pipelines described in §10:

- `orchestrator/`: Coordinates multi-agent flows between voice, vision, catalogue, pricing, and matching.
- `speech/`: ASR and speech processing (Whisper / Indic models).
- `translation/`: Multilingual translation utilities.
- `vision/`: Photography assistant, image quality scoring, and visual attribute extraction.
- `catalogue/`: LLM-powered product title, description, and attribute generation.
- `pricing/`: Market explanation and dynamic price guidance.
- `matching/`: Candidate ranking and semantic query resolution.
- `negotiation/`: Buyer-seller conversational negotiation agent with deterministic price-floor guardrails.
- `fraud/`: Trust scoring, duplicate image detection (pHash), and anomaly flagging.
