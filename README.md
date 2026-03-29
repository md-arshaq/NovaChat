# NGD Real-Time Chat 💬

A blazing-fast, real-time web chat application built using the powerful combination of React, Node.js, Socket.IO, and Redis. It features intuitive global public chat rooms, direct private messaging, online status tracking, and cloud-hosted profile customization.

---

## ✨ Features

- **Instant Messaging**: Millisecond delivery of messages via WebSocket architecture using Socket.IO.
- **Global & Private Conversations**: Hop into the global chat room to talk to everyone, or click on an online user to launch an isolated, direct 1-on-1 private conversation.
- **Live Typing Indicators**: Instantly see when the person you are chatting with is typing `...`.
- **Real-Time Presence Tracking**: See who is currently online with live dynamic status dots, tracked robustly via Redis Sets.
- **Profile Customization**: Users can personalize their identity by writing a custom bio and uploading an avatar. Uploaded media is securely and cleanly handled via **Cloudinary**.
- **Modern "Glass" UI**: A beautiful, bespoke dark-mode interface applying glassmorphism aesthetics, fluid micro-animations, toast notifications, and responsive layouts natively styled with Vanilla CSS.

---

## 🛠 Tech Stack

### Client (Frontend)
- **React 18** (Bootstrapped via Vite for instant HMR)
- **Socket.IO-Client** (Persistent TCP WebSocket connections)
- **React Router v6** (Client-side routing & protection)
- **Context API** (Global state management for Auth and Profiles)

### Server (Backend)
- **Node.js & Express** 
- **Socket.IO** (Real-time event broadcasting)
- **Redis** 
  - *Hashes*: Secure, fast storage for user profiles and authenticated sessions.
  - *Streams*: Used to persist sequential chat history (`chat_stream:global` and dynamic private stream keys) ensuring chronological message scaling.
- **Cloudinary SDK** (Cloud media storage for Avatar images)
- **Multer** (Parsing `multipart/form-data`)

---

## 🚀 Installation & Setup

### Prerequisites
1. **Node.js** (v16+ recommended)
2. **Redis** server running locally (usually port `6379`).
3. A **[Cloudinary Account](https://cloudinary.com/)** for profile picture handling.

### 1. Install Dependencies
You will need to install dependencies for both the `frontend` client and the `backend` server.

```bash
# Navigate to backend and install
cd backend
npm install

# Navigate back, enter frontend, and install
cd ../frontend
npm install
```

### 2. Configure Environment Variables
Inside the `backend` folder, create a `.env` file and supply your configurations:

```env
# Core Server Config
PORT=3001
SESSION_TTL=3600

# Redis Connection String
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Cloudinary Setup (Grab from your Cloudinary Dashboard)
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### 3. Run the Application
Make sure your Redis server daemon is running in the background.

**Start the Backend API (from `/backend` directory):**
```bash
npm run dev
# Server should emit: "Server running on port 3001"
```

**Start the Frontend UI (from `/frontend` directory):**
```bash
npm run dev
# Vite will launch the React app at http://localhost:5173
```

---

## 📁 Project Architecture Map
```text
📦NGD
 ┣ 📂backend
 ┃ ┣ 📂config        # Redis client initialization
 ┃ ┣ 📂controllers   # Core business logic (Auth, Chat, Users)
 ┃ ┣ 📂middleware    # Session validation for protected routes
 ┃ ┣ 📂routes        # Express API endpoints
 ┃ ┣ 📂utils         # Helpers (Hash generation, Key structuring)
 ┃ ┣ 📜server.js     # Entry point & Socket event listener attachment
 ┃ ┗ 📜.env          # Environment configuration
 ┗ 📂frontend
 ┃ ┣ 📂public        # Static assets
 ┃ ┣ 📂src
 ┃ ┃ ┣ 📂components  # Reusable UI (ChatArea, Sidebar, ProfileModal, UserAvatar)
 ┃ ┃ ┣ 📂context     # Global AuthContext provider
 ┃ ┃ ┣ 📂pages       # Views (Login, Signup, Chat Layout)
 ┃ ┃ ┣ 📂services    # Vanilla JS Fetch API wrapper definitions
 ┃ ┃ ┣ 📜index.css   # Comprehensive, centralized design system
 ┃ ┃ ┣ 📜main.jsx    # React DOM root
 ┃ ┃ ┗ 📜socket.js   # Client-side Socket.io initialization
 ┃ ┗ ...
```

---

*Authored for the NGD Chat Application natively running on Windows/Linux environments.*
