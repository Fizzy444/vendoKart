# Workers Subsystem Scaffold

This directory houses background tasks and Celery/Redis queue workers described in §20:

- `image_tasks/`: Asynchronous image processing, watermarking, perceptual hashing, and computer vision tasks.
- `speech_tasks/`: Audio decoding, background transcription, and batch ASR jobs.
- `catalogue_tasks/`: Asynchronous multi-attribute catalog generation and enrichment.
- `embedding_tasks/`: Batch embedding generation for OpenSearch / Qdrant vector indexing.
