from fastapi import APIRouter,HTTPException,FastAPI
from fastapi.middleware.cors import CORSMiddleware
from chat import router as chat

app = FastAPI()

ORIGINS = [
    "http://localhost:4200",  # Angular dev server
    "http://localhost:8080",  # springboot dev server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat)
