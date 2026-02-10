# RAG Chatbot with Web Scraping

This project is an AI Chatbot that can scrape websites, store their content, and allow you to chat with that content (Retrieval-Augmented Generation - RAG).

## Features

- **Web Scraping**: Ingests text from any provided URL (and its internal links).
- **Vector Database**: Stores scraped content efficiently using ChromaDB.
- **RAG Chat**: answers questions based *only* on the scraped content when a website is selected.
- **Dual Model Support**: Works with Google Gemini (Recommended) or OpenAI.
- **Interactive UI**: Simple web interface to manage websites and chat.

## Setup

1.  **Prerequisites**:
    -   Python 3.10+
    -   An API Key for Google Gemini (Free tier available) OR OpenAI.

2.  **Install Dependencies**:
    ```bash
    # Create virtual environment
    python3 -m venv venv
    source venv/bin/activate

    # Install packages
    pip install -r requirements.txt
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    GEMINI_API_KEY=your_google_api_key_here
    # OR
    OPENAI_API_KEY=your_openai_api_key_here
    ```

4.  **Run the Application**:
    ```bash
    ./venv/bin/uvicorn app.main:app --reload
    ```

5.  **Use**:
    Open `http://127.0.0.1:8000` in your browser.

## Project Structure

See `PROJECT_EXPLANATION.md` for a detailed code walkthrough.
