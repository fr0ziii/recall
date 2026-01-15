#!/usr/bin/env python3
"""Pre-download embedding models for Docker image baking.

This script downloads all supported sentence-transformer models
during the Docker build phase to avoid cold-start latency.
"""

from sentence_transformers import SentenceTransformer

MODELS = [
    # Text models
    "all-MiniLM-L6-v2",
    "all-mpnet-base-v2",
    "paraphrase-MiniLM-L6-v2",
    "multi-qa-MiniLM-L6-cos-v1",
    # CLIP models
    "clip-ViT-B-32",
    "clip-ViT-B-16",
    "clip-ViT-L-14",
]


def main() -> None:
    """Download and cache all supported models."""
    for model_name in MODELS:
        print(f"Pre-loading model: {model_name}")
        try:
            SentenceTransformer(model_name)
            print(f"  Successfully loaded: {model_name}")
        except Exception as e:
            print(f"  Warning: Failed to load {model_name}: {e}")
    print("Model pre-loading complete.")


if __name__ == "__main__":
    main()
