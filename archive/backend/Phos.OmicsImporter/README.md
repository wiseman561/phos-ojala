# Phos.OmicsImporter

A FastAPI microservice for importing and validating omics data files into the Phos platform.

## Overview

This service provides a REST API for uploading and validating omics data files (CSV or JSON format). It validates that the files conform to the required schema and stores them in a PostgreSQL database for further processing.

## Requirements

- Python 3.11+
- PostgreSQL 15+
- Docker and Docker Compose (for containerized deployment)

## Running Locally

### Using Docker Compose

The easiest way to run the service is using Docker Compose:

```bash
# From the project root
docker-compose -f docker-compose.yml -f omics.dev.yml up omics-importer
```

This will start both the PostgreSQL database and the OmicsImporter service.

### Manual Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Set up the database:

```bash
# Set up the database URL
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/omics

# Run migrations
cd src/backend/Phos.OmicsImporter
alembic upgrade head
```

3. Run the service:

```bash
python run.py
```

## API Endpoints

### `POST /import`

Upload an omics data file (CSV or JSON).

Requirements:
- File must be in CSV or JSON format
- Data must contain columns/fields: `sample_id`, `gene`, `value`

Example curl command:

```bash
curl -X POST -F "file=@your_omics_data.csv" http://localhost:8085/import
```

Response:

```json
{
  "success": true,
  "file_id": 1,
  "file_name": "your_omics_data.csv",
  "rows_count": 1000,
  "message": "Successfully imported file with 100 samples and 10 genes"
}
```

### `GET /health`

Health check endpoint.

```bash
curl http://localhost:8085/health
```

Response:

```json
{
  "status": "healthy",
  "service": "omics-importer"
}
```

## File Format Requirements

### CSV Format

CSV files must have a header row with at least these columns:
- `sample_id`: Identifier for the sample
- `gene`: Identifier for the gene
- `value`: Numeric value of the measurement

Example:

```csv
sample_id,gene,value
SAMPLE001,BRCA1,0.85
SAMPLE001,BRCA2,1.2
SAMPLE002,BRCA1,0.75
```

### JSON Format

JSON files must be an array of objects, each having at least these fields:
- `sample_id`: Identifier for the sample
- `gene`: Identifier for the gene
- `value`: Numeric value of the measurement

Example:

```json
[
  {"sample_id": "SAMPLE001", "gene": "BRCA1", "value": 0.85},
  {"sample_id": "SAMPLE001", "gene": "BRCA2", "value": 1.2},
  {"sample_id": "SAMPLE002", "gene": "BRCA1", "value": 0.75}
]
``` 