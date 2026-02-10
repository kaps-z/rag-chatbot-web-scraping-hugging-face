# Project Code Explanation

This document explains the internal structure of the RAG Chatbot project.

## 1. `app/main.py` (The Backend API)

This is the entry point of the application, built with **FastAPI**.

### Key Functions:

-   `POST /api/ingest`:
    -   Receives a URL and a Name.
    -   Calls `rag.ingest_url` to scrape and save the data.
    -   Returns the number of text chunks saved.

-   `GET /api/websites`:
    -   Calls `rag.list_collections` to show which websites you have scraped.

-   `POST /api/chat`:
    -   Receives a user message and an optional `collection_name`.
    -   **If `collection_name` is provided**:
        1.  Calls `rag.get_context` to find relevant text from the database.
        2.  Updates the `system_instruction` to include this context (using `prompts.py`).
    -   **Model Interaction**:
        -   Sends the prompt to **Gemini** or **OpenAI** based on available keys.
    -   Returns the AI's reply.

---

## 2. `app/rag.py` (The RAG Engine)

This file handles the "heavy lifting" of data processing.

### Key Functions:

-   `scrape_website(url)`:
    -   Uses `requests` and `BeautifulSoup` to fetch the HTML.
    -   Cleans the text (removes scripts/styles).
    -   Crawls internal links (up to 10 pages) to get more context.
    -   Returns a list of raw text documents.

-   `ingest_url(url, collection_name)`:
    -   Calls `scrape_website`.
    -   **Splits Text**: Uses `RecursiveCharacterTextSplitter` to break long text into smaller "chunks" (1000 characters). This is crucial for searching.
    -   **Embeds & Saves**: Uses `GoogleGenerativeAIEmbeddings` to convert text to numbers (vectors) and saves them in `ChromaDB` (local folder `storage/chroma_db`).

-   `get_context(query, collection_name)`:
    -   Takes the user's question (`query`).
    -   Searches the database for the top 4 most similar text chunks.
    -   Returns them as a single string to be fed into the AI.

---

## 3. `app/prompts.py` (Prompt Management)

Separates the AI instructions from the code logic.

-   `RAG_SYSTEM_PROMPT`: The template used when chatting with a website. It places the retrieved context before the user's question.
-   `DEFAULT_SYSTEM_PROMPT`: A simple fallback assistant persona.

---

## 4. `app/static/` (The Frontend)

-   `index.html`: The layout. Contains the chat box and the "Controls" section (Add Website, Select Website).
-   `script.js`:
    -   Handles button clicks.
    -   `handleIngest()`: Sends the URL to the backend to be scraped.
    -   `sendMessage()`: Sends the chat text + selected website to the backend.
