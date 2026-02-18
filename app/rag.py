import os
import requests
from bs4 import BeautifulSoup
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import chromadb
from urllib.parse import urljoin, urlparse
from playwright.async_api import async_playwright

# Configuration
PERSIST_DIRECTORY = os.path.join(os.getcwd(), "storage", "chroma_db")
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

def get_embeddings():
    return HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

def get_vector_store(collection_name: str):
    embeddings = get_embeddings()
    os.makedirs(PERSIST_DIRECTORY, exist_ok=True)
    
    return Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=PERSIST_DIRECTORY,
    )

async def scrape_website(url: str, max_pages: int = 10) -> list[Document]:
    """
    Scrapes the given URL and its internal links up to max_pages.
    Uses Playwright Async API.
    """
    domain = urlparse(url).netloc
    visited = set()
    queue = [url]
    documents = []

    print(f"Starting scrape for {url} using Playwright (Async)...")

    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=True)
        # Create a context with user-agent
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        )
        page = await context.new_page()

        while queue and len(visited) < max_pages:
            current_url = queue.pop(0)
            if current_url in visited:
                continue
            
            try:
                print(f"Scraping: {current_url}")
                # Go to page and wait for network to be idle
                await page.goto(current_url, wait_until="networkidle", timeout=20000)
                
                # Get the fully rendered HTML
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')
                
                # Cleanup
                for script in soup(["script", "style", "nav", "footer", "iframe", "noscript", "svg", "canvas"]):
                    script.extract()
                
                text = soup.get_text(separator="\n")
                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                clean_text = '\n'.join(chunk for chunk in chunks if chunk)
                
                documents.append(Document(page_content=clean_text, metadata={"source": current_url}))
                visited.add(current_url)
                
                # Find links
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    full_url = urljoin(current_url, href)
                    parsed_href = urlparse(full_url)
                    
                    if parsed_href.netloc == domain and full_url not in visited and full_url not in queue:
                        queue.append(full_url)
                        
            except Exception as e:
                print(f"Error scraping {current_url}: {e}")
                # Try next URL in queue
                visited.add(current_url)

        await browser.close()
            
    return documents

async def ingest_url(url: str, collection_name: str):
    print(f"Starting ingestion for {url} into collection {collection_name}")
    docs = await scrape_website(url)
    
    if not docs:
         raise ValueError("No content scraped. The website might be blocking headless browsers or is unreachable.")

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(docs)
    
    print(f"Scraping complete. Found {len(docs)} pages, split into {len(splits)} chunks.")
    print(f"Docs-------->.{docs}")
    
    if not splits:
        raise ValueError("Content scraped but was empty after splitting.")

    vector_store = get_vector_store(collection_name)
    vector_store.add_documents(documents=splits)
    print(f"Ingestion complete. Added {len(splits)} chunks.")
    return len(splits)

def list_collections():
    client = chromadb.PersistentClient(path=PERSIST_DIRECTORY)
    try:
        collections = client.list_collections()
        return [c.name for c in collections]
    except Exception as e:
        print(f"Error listing collections: {e}")
        return []

def get_context(query: str, collection_name: str, k: int = 4):
    vector_store = get_vector_store(collection_name)
    docs = vector_store.similarity_search(query, k=k)
    print(f"Retrieved {len(docs)} context documents for query: '{docs}'")
    return "\n\n".join([doc.page_content for doc in docs])