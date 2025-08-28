from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
import csv
import json
import io
import logging
from ..db.database import get_db
from ..db.models import OmicsRaw
from ..schemas.schemas import OmicsDataRow, ImportResponse, OmicsFileCreate

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/import")

async def validate_csv_structure(file_content: str) -> tuple[bool, str, int, int]:
    """
    Validate the CSV file structure.
    Returns (is_valid, error_message, sample_count, gene_count)
    """
    try:
        reader = csv.DictReader(io.StringIO(file_content))
        headers = reader.fieldnames
        
        # Check required headers
        required_headers = {"sample_id", "gene", "value"}
        if not required_headers.issubset(set(headers)):
            missing = required_headers - set(headers)
            return False, f"Missing required columns: {', '.join(missing)}", 0, 0
        
        # Validate data rows
        sample_ids = set()
        genes = set()
        row_count = 0
        
        for row in reader:
            try:
                # Create a model instance to validate data types
                OmicsDataRow(
                    sample_id=row["sample_id"],
                    gene=row["gene"],
                    value=float(row["value"])
                )
                sample_ids.add(row["sample_id"])
                genes.add(row["gene"])
                row_count += 1
            except ValueError as e:
                return False, f"Row {row_count+1}: {str(e)}", 0, 0
        
        if row_count == 0:
            return False, "File contains no data rows", 0, 0
            
        return True, "", len(sample_ids), len(genes)
        
    except Exception as e:
        return False, f"Error parsing CSV: {str(e)}", 0, 0

async def validate_json_structure(file_content: str) -> tuple[bool, str, int, int]:
    """
    Validate the JSON file structure.
    Returns (is_valid, error_message, sample_count, gene_count)
    """
    try:
        data = json.loads(file_content)
        
        if not isinstance(data, list):
            return False, "JSON file must contain a list of data objects", 0, 0
            
        if len(data) == 0:
            return False, "File contains no data rows", 0, 0
            
        sample_ids = set()
        genes = set()
        
        for i, item in enumerate(data):
            try:
                # Create a model instance to validate data
                row = OmicsDataRow(**item)
                sample_ids.add(row.sample_id)
                genes.add(row.gene)
            except Exception as e:
                return False, f"Row {i+1}: {str(e)}", 0, 0
                
        return True, "", len(sample_ids), len(genes)
        
    except json.JSONDecodeError as e:
        return False, f"Invalid JSON format: {str(e)}", 0, 0
    except Exception as e:
        return False, f"Error parsing JSON: {str(e)}", 0, 0

@router.post("", response_model=ImportResponse)
async def import_omics_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Import an omics data file (CSV or JSON)
    """
    try:
        # Check file extension
        file_extension = file.filename.split(".")[-1].lower()
        if file_extension not in ["csv", "json"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only CSV and JSON files are supported"
            )
            
        # Read file content
        file_content = await file.read()
        content_str = file_content.decode("utf-8")
        
        # Validate file structure based on type
        is_valid = False
        error_message = ""
        sample_count = 0
        gene_count = 0
        
        if file_extension == "csv":
            is_valid, error_message, sample_count, gene_count = await validate_csv_structure(content_str)
        else:  # JSON
            is_valid, error_message, sample_count, gene_count = await validate_json_structure(content_str)
            
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file structure: {error_message}"
            )
            
        # Create database record
        omics_file = OmicsFileCreate(
            file_name=file.filename,
            file_type=file_extension,
            file_content=content_str,
            sample_count=sample_count,
            gene_count=gene_count
        )
        
        # Save to database
        db_file = OmicsRaw(
            file_name=omics_file.file_name,
            file_type=omics_file.file_type,
            file_content=omics_file.file_content,
            sample_count=omics_file.sample_count,
            gene_count=omics_file.gene_count
        )
        
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        # Return success response
        return ImportResponse(
            success=True,
            file_id=db_file.id,
            file_name=db_file.file_name,
            rows_count=sample_count * gene_count,
            message=f"Successfully imported file with {sample_count} samples and {gene_count} genes"
        )
            
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.exception("Error processing file upload")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        ) 