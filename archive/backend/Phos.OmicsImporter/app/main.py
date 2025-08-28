from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging
from .api.import_router import router as import_router
from .db.database import engine, Base, get_db

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create the FastAPI app
app = FastAPI(
    title="Phos OmicsImporter API",
    description="API for importing omics data files into the Phos platform",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(import_router, tags=["Import"])

# Create database tables
Base.metadata.create_all(bind=engine)

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "omics-importer"}

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with service information."""
    return {
        "service": "Phos OmicsImporter",
        "version": "0.1.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "import": "/import",
        }
    } 