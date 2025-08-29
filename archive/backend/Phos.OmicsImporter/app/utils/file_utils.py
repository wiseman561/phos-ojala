import os
import csv
import json
import io
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

def get_file_extension(filename: str) -> str:
    """Extract file extension from filename."""
    return filename.split(".")[-1].lower()

def is_valid_file_type(filename: str) -> bool:
    """Check if file type is supported."""
    extension = get_file_extension(filename)
    return extension in ["csv", "json"]

def extract_sample_ids_from_csv(content: str) -> Optional[List[str]]:
    """Extract unique sample IDs from CSV content."""
    try:
        reader = csv.DictReader(io.StringIO(content))
        if "sample_id" not in reader.fieldnames:
            return None
        return list(set(row["sample_id"] for row in reader))
    except Exception as e:
        logger.error(f"Error extracting sample IDs from CSV: {e}")
        return None

def extract_sample_ids_from_json(content: str) -> Optional[List[str]]:
    """Extract unique sample IDs from JSON content."""
    try:
        data = json.loads(content)
        if not isinstance(data, list):
            return None
        sample_ids = set()
        for item in data:
            if "sample_id" in item:
                sample_ids.add(item["sample_id"])
        return list(sample_ids)
    except Exception as e:
        logger.error(f"Error extracting sample IDs from JSON: {e}")
        return None 