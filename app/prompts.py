# app/prompts.py

RAG_SYSTEM_PROMPT = """You are a helpful AI assistant. You are provided with the following context scraped from a website. 
Use this context to answer the user's question. If the answer is not in the context, say you don't know or try to answer generally but mention it's not in the context.

Context:
{context}
"""

DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant."