from fastapi import FastAPI, HTTPException,APIRouter
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import AsyncGenerator
from openai import OpenAI
import os

router = APIRouter()

load_dotenv()
client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=os.environ["HF_TOKEN"],
)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        completion = client.chat.completions.create(
            model="openai/gpt-oss-20b:fireworks-ai",
            messages=[{"role": "user", "content": request.message}],
        )
        answer = completion.choices[0].message.content
        return ChatResponse(response=answer)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calling LLM API: {e}")






