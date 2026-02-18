# React Frontend Development Guide

This guide outlines the architecture and tools used for the new React frontend of the **WebScrapperAI** project. This is designed for beginners who want to scale their application.

## Tech Stack

### 1. **React (v18+)**
   - **Why?** The most popular JavaScript library for building user interfaces. It uses a component-based architecture, making code reusable and easier to manage.
   - **Concepts to Learn:**
     - **Components:** Building blocks of UI (e.g., `ChatBox`, `Sidebar`).
     - **Hooks:** Functions like `useState` (to save data like chat history) and `useEffect` (to fetch data when the app loads).
     - **Props:** Passing data between components.

### 2. **Vite**
   - **Why?** A build tool that is much faster than the older `create-react-app`. It starts your dev server instantly.
   - **Usage:** We use it to run the local server (`npm run dev`) and build for production (`npm run build`).

### 3. **Tailwind CSS**
   - **Why?** A utility-first CSS framework. Instead of writing separate `.css` files, you add classes like `flex`, `p-4`, `text-blue-500` directly to your HTML. It speeds up development significantly.

### 4. **Axios**
   - **Why?** A library to make HTTP requests (like fetching data from our Python backend). It's easier to use than the built-in `fetch` API.

---

## Project Structure

```
frontend/
├── public/              # Static assets (images, favicon)
├── src/
│   ├── components/      # Reusable UI parts
│   │   ├── Chat.jsx
│   │   ├── Sidebar.
        # List of libraries (dependencies)
└── vite.config.js       # Configuration (Port, Proxy)
```

## How it Connects to Backend

We use a **Proxy**.
- The React app runs on `http://localhost:5173`
- The Python backend runs on `http://localhost:8000`
- We configure Vite so that any request to `/api/...` is automatically sent to `localhost:8000`. This prevents "CORS" errors (security blocks).

## Next Steps for You
1. **Explore `src/App.jsx`**: Try changing the text and see it update instantly.
2. **Create a new Component**: Try making a `<Footer />` and adding it to `App`.
3. **State Management**: As the app grows, we might use **Context API** or **Zustand** to manage global state (like the current user or theme).
