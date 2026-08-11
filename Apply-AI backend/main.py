"""
ApplyAI FastAPI Application

Main backend entry point.
"""


import logging
import logging.config
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings

logging.config.dictConfig(
    {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s %(levelname)-8s %(name)s: %(message)s",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "standard",
            },
        },
        "root": {
            "handlers": ["console"],
            "level": os.getenv("LOG_LEVEL", "INFO"),
        },
    }
)

# Fail with a readable message rather than an SDK traceback when a key is
# missing. Must run before the route imports below, which instantiate the
# Supabase, Pinecone, Voyage and Groq clients at module import time.
settings.validate()

from routes import resume  # noqa: E402
from routes import job  # noqa: E402
from routes import generate  # noqa: E402
from routes import profile  # noqa: E402
from routes import email  # noqa: E402


app = FastAPI(
    title="ApplyAI",
    description="AI powered job application assistant",
    version="1.0.0"
)


# Origins are environment-driven so deployment does not require a code change.
# allow_credentials is off: this API authenticates with Bearer tokens, not
# cookies, and enabling it forbids the wildcard origin anyway.
cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logging.getLogger("main").exception("Unhandled exception on %s %s", request.method, request.url.path)
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."}
    )


app.include_router(
    resume.router,
    prefix="/resumes",
    tags=["Resumes"]
)


app.include_router(
    job.router,
    prefix="/job",
    tags=["Job"]
)


app.include_router(
    generate.router,
    prefix="/generate",
    tags=["Generate"]
)


app.include_router(
    profile.router,
    prefix="/profile",
    tags=["Profile"]
)


app.include_router(
    email.router,
    prefix="/email",
    tags=["Email"]
)



@app.get("/")
def health_check():
    """
    Backend health check.
    """

    return {
        "status": "ApplyAI backend running"
    }