import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from openai import OpenAI
from google import genai
from langchain_huggingface import HuggingFaceEndpoint
from dotenv import load_dotenv
from typing import Optional, List

# Local imports
try:
    from . import rag
    from .prompts import RAG_SYSTEM_PROMPT, DEFAULT_SYSTEM_PROMPT
except ImportError:
    # Fallback for when running directly
    import rag
    from prompts import RAG_SYSTEM_PROMPT, DEFAULT_SYSTEM_PROMPT

# Load environment variables
load_dotenv()

# Initialize Clients
openai_client = None
if os.getenv("OPENAI_API_KEY"):
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

gemini_client = None
if os.getenv("GEMINI_API_KEY"):
    gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

class ChatRequest(BaseModel):
    message: str
    collection_name: Optional[str] = None

class IngestRequest(BaseModel):
    url: str
    collection_name: str

@app.get("/api/websites")
async def list_websites():
    try:
        collections = rag.list_collections()
        return {"websites": collections}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ingest")
async def ingest_endpoint(request: IngestRequest):
    try:
        # Simple validation
        if not request.url.startswith("http"):
            raise HTTPException(status_code=400, detail="Invalid URL")
        print(f"Received ingestion request for URL: {request.url} into collection: {request.collection_name}")
        num_chunks = await rag.ingest_url(request.url, request.collection_name)
        return {"status": "success", "chunks": num_chunks, "message": f"Successfully ingested {request.url}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    hf_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")

    try:
        system_prompt = DEFAULT_SYSTEM_PROMPT
        context = ""

        # Retrieve context if collection is specified
        if request.collection_name:
            try:
                context = rag.get_context(request.message, request.collection_name)
                if context:
                    system_prompt = RAG_SYSTEM_PROMPT.format(context=context, question=request.message)
                else:
                    # Fallback if no context found (rare)
                    system_prompt = DEFAULT_SYSTEM_PROMPT + "\n\n(No relevant context found in the website data.)"
            except Exception as e:
                print(f"RAG Error: {e}")
                # Continue without RAG if error
                pass

        if gemini_key:
            # Use Gemini
            if request.collection_name:
                 full_prompt = system_prompt # Already contains user question
            else:
                 full_prompt = f"{system_prompt}\n\nUser: {request.message}"

            response = gemini_client.models.generate_content(
                model='gemini-2.0-flash',
                contents=full_prompt
            )
            reply = response.text
        elif openai_key:
            # Use OpenAI
            messages = [{"role": "system", "content": system_prompt}] 
            if not request.collection_name:
                messages.append({"role": "user", "content": request.message})
            # If RAG, 'system_prompt' already has the question embedded, but OpenAI expects a user message usually.
            # Ideally we split them.
            if request.collection_name:
                 # Re-structure for OpenAI better quality
                 messages = [
                     {"role": "system", "content": RAG_SYSTEM_PROMPT.format(context=context, question=request.message).replace(request.message, "{question}")}, # Keep template ish
                     {"role": "user", "content": request.message}
                 ]

            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages
            )
            reply = response.choices[0].message.content
        elif hf_token:
            # Use Hugging Face Inference API
            # Recommended model: mistralai/Mistral-7B-Instruct-v0.2 or similar
            repo_id = "mistralai/Mistral-7B-Instruct-v0.2"
            
            llm = HuggingFaceEndpoint(
                repo_id=repo_id,
                temperature=0.5,
                huggingfacehub_api_token=hf_token
            )
            
            # Construct prompt for LLM
            if request.collection_name:
                # system_prompt already has the RAG context and question formatted
                full_prompt = system_prompt
            else:
                full_prompt = f"{system_prompt}\n\nUser: {request.message}\nAssistant:"

            reply = llm.invoke(full_prompt)

        else:
            # Fallback: Use local embeddings (SentenceTransformer) via RAG to retrieve context.
            # Since 'all-MiniLM-L6-v2' is an embedding model, it cannot generate text,
            # so we return the retrieved chunks directly.
            if context:
                reply = f"**[Local Mode - Retrieval Only]**\n\nI found the following relevant information:\n\n{context}"
            else:
                reply = "**[Local Mode]** No API keys (Gemini/OpenAI/HuggingFace) found and no relevant context retrieved from the collection."

        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
