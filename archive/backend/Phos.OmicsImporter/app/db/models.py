from sqlalchemy import Column, Integer, String, Text, DateTime, func
from datetime import datetime
from .database import Base

class OmicsRaw(Base):
    """
    Model for storing raw omics data files.
    """
    __tablename__ = "omics_raw"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # CSV or JSON
    file_content = Column(Text, nullable=False)
    sample_count = Column(Integer, nullable=True)
    gene_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed = Column(Integer, default=0)  # 0=not processed, 1=processing, 2=processed

    def __repr__(self):
        return f"<OmicsRaw(id={self.id}, file_name='{self.file_name}', file_type='{self.file_type}')>" 