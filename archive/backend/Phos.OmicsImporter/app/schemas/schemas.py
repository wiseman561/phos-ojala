from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any

class OmicsDataRow(BaseModel):
    """
    Schema for a row of omics data.
    """
    sample_id: str
    gene: str
    value: float

class OmicsFile(BaseModel):
    """
    Schema for a stored omics file.
    """
    id: int
    file_name: str
    file_type: str
    sample_count: Optional[int] = None
    gene_count: Optional[int] = None
    created_at: datetime
    processed: int
    
    class Config:
        orm_mode = True

class OmicsFileCreate(BaseModel):
    """
    Schema for creating a new omics file record.
    """
    file_name: str
    file_type: str
    file_content: str
    sample_count: Optional[int] = None
    gene_count: Optional[int] = None

class ImportResponse(BaseModel):
    """
    Schema for import response.
    """
    success: bool
    file_id: Optional[int] = None
    file_name: Optional[str] = None
    rows_count: Optional[int] = None
    message: str 