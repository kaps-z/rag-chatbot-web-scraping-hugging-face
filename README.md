# WebScrapperAI - RAG Chatbot

WebScrapperAI is a powerful Retrieval-Augmented Generation (RAG) application that allows you to scrape websites, store their content in a vector database, and chat with the ingested data using advanced AI models.

## 🚀 Features

-   **Web Scraping**: Ingests text from any provided URL (including internal links).
-   **Vector Database**: Efficiently stores and retrieves scraped content using **ChromaDB**.
-   **RAG Chat**: Answers questions based *strictly* on the scraped content to reduce hallucinations.
-   **Multi-Model Support**:
    -   **Google Gemini** (Recommended, Free tier available).
    -   **OpenAI** (GPT-3.5/4).
    -   **Hugging Face** (Open-source models like Mistral).
    -   **Local Mode**: Fallback to local retrieval if no API keys are provided.
-   **Modern UI**: A responsive React frontend built with Material UI.

## 🛠️ Tech Stack

-   **Backend**: Python, FastAPI, LangChain, ChromaDB.
-   **Frontend**: React, Vite, Material UI (MUI).

---

## 📦 Setup & Installation

### 1. Prerequisites
-   **Python 3.10+**
-   **Node.js 16+** & **npm**

### 2. Backend Setup

1.  Navigate to the project root.
2.  Create and activate a virtual environment:
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Environment Variables**:
    Create a `.env` file in the root directory and add your API keys:
    ```env
    # Choose at least one:
    GEMINI_API_KEY=your_google_api_key
    OPENAI_API_KEY=your_openai_api_key
    HUGGINGFACEHUB_API_TOKEN=your_hf_token
    ```

5.  Start the Backend Server:
    ```bash
    ./venv/bin/uvicorn app.main:app --reload
    ```
    The backend will run at `http://127.0.0.1:8000`.

### 3. Frontend Setup

1.  Open a new terminal and navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install Node.js dependencies:
    ```bash
    npm install
    ```
3.  Start the Frontend Development Server:
    ```bash
    npm run dev
    ```
    The application will typically start at `http://localhost:5173`.

---

## 🖥️ Usage

1.  Open your browser and go to the frontend URL (e.g., `http://localhost:5173`).
2.  **Ingest Data**:
    -   Go to the "Ingest Data" tab.
    -   Enter a **Target URL** (e.g., `https://react.dev`).
    -   Enter a **Collection Name** (e.g., `react-docs`).
    -   Click "Start Ingestion".
3.  **Chat**:
    -   Go to the "Chat" tab.
    -   Select a collection from the sidebar (under "MY COLLECTIONS") to chat *specifically* with that data.
    -   Or deselect to chat with the general AI.
    -   Type your message and send!

---

## 📂 Project Structure

-   **`app/`**: Contains the FastAPI backend logic.
    -   `main.py`: API Endpoints (`/api/ingest`, `/api/chat`).
    -   `rag.py`: Core logic for scraping, chunking, embedding, and retrieval.
    -   `prompts.py`: System prompts for the AI.
-   **`frontend/`**: Contains the React application.
    -   `src/App.jsx`: Main UI component.
    -   `vite.config.js`: Configuration for proxying API requests to the backend.
-   **`storage/`**: Local storage for the ChromaDB vector database.