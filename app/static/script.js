document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const collectionSelect = document.getElementById('collection-select');
    const refreshBtn = document.getElementById('refresh-btn');
    const newUrlInput = document.getElementById('new-url');
    const newNameInput = document.getElementById('new-name');
    const ingestBtn = document.getElementById('ingest-btn');
    const statusMsg = document.getElementById('status-msg');

    // --- RAG Functions ---

    async function loadWebsites() {
        try {
            const response = await fetch('/api/websites');
            const data = await response.json();
            
            // Save current selection
            const currentSelection = collectionSelect.value;
            
            // Clear existing options (except first)
            while (collectionSelect.options.length > 1) {
                collectionSelect.remove(1);
            }

            data.websites.forEach(site => {
                const option = document.createElement('option');
                option.value = site;
                option.textContent = site;
                collectionSelect.appendChild(option);
            });

            // Restore selection if it still exists
            if (data.websites.includes(currentSelection)) {
                collectionSelect.value = currentSelection;
            }
        } catch (error) {
            console.error('Failed to load websites:', error);
        }
    }

    async function handleIngest() {
        const url = newUrlInput.value.trim();
        const name = newNameInput.value.trim();

        if (!url || !name) {
            statusMsg.textContent = "Please enter both URL and Name.";
            statusMsg.style.color = "red";
            return;
        }

        statusMsg.textContent = "Scraping and ingesting... This may take a moment.";
        statusMsg.style.color = "blue";
        ingestBtn.disabled = true;

        try {
            const response = await fetch('/api/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url, collection_name: name })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Ingestion failed');
            }

            statusMsg.textContent = data.message;
            statusMsg.style.color = "green";
            newUrlInput.value = '';
            newNameInput.value = '';
            loadWebsites(); // Refresh list
        } catch (error) {
            statusMsg.textContent = "Error: " + error.message;
            statusMsg.style.color = "red";
        } finally {
            ingestBtn.disabled = false;
        }
    }

    // --- Chat Functions ---

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
        if (sender === 'error') {
            messageDiv.classList.add('error-message');
            messageDiv.classList.remove('bot-message', 'user-message');
        }
        messageDiv.textContent = text;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Add user message
        addMessage(text, 'user');
        userInput.value = '';
        userInput.disabled = true;
        sendBtn.disabled = true;

        const collectionName = collectionSelect.value || null;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    message: text,
                    collection_name: collectionName
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Network response was not ok');
            }

            const data = await response.json();
            addMessage(data.reply, 'bot');
        } catch (error) {
            console.error('Error:', error);
            addMessage('Error: Could not reach the chatbot. ' + error.message, 'error');
        } finally {
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
        }
    }

    // --- Event Listeners ---

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    ingestBtn.addEventListener('click', handleIngest);
    refreshBtn.addEventListener('click', loadWebsites);

    // Initial Load
    loadWebsites();
});