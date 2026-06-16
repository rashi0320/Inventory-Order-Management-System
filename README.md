# Ethara.AI Inventory & Order Management System

A simplified, modern, and beautiful **Inventory & Order Management System** developed as part of the Ethara.AI engineering assessment. This application enables real-time management of products, customers, and orders with strict business rule validation and transactional database safety.

## 🚀 Features & Business Rules

1. **Transactional Order Management**: Orders are created inside a database transaction using row locks (`SELECT FOR UPDATE`) to prevent race conditions.
2. **Inventory Safety**: Stock level validation ensures orders cannot be created if product inventory is insufficient.
3. **Automatic Stock Reduction**: Stock is automatically deducted when a successful order is placed.
4. **Stock Recovery on Cancellation/Deletion**: When an order is deleted via `DELETE /orders/{id}`, its items' quantities are automatically returned back to product stock.
5. **Unique Product SKUs**: The system prevents creating or updating products with duplicate SKUs.
6. **Unique Customer Emails**: Emails are indexed and validated to be globally unique.
7. **Premium Responsive UI**: Built with a sleek dark-themed, glassmorphic layout, micro-animations, search filters, and real-time toast notifications.
8. **Demo Data Seeding**: Populates the system with high-quality mock data (Immersive tech products like VR headsets and AR glasses) in one click or via a simple CLI script.

---

## 🛠️ Technology Stack

- **Backend**: Python, [FastAPI](https://fastapi.tiangolo.com/), [SQLAlchemy ORM](https://www.sqlalchemy.org/), [Pydantic v2](https://docs.pydantic.dev/).
- **Frontend**: React, [Vite](https://vite.dev/), Custom Vanilla CSS.
- **Database**: PostgreSQL (with automatic SQLite fallback for simple local testing).
- **Containerization**: Docker, Docker Compose (including `.dockerignore` filters).
- **Web Server / Proxy**: Nginx (serving built frontend and reverse-proxying API calls to backend).

---

## 📦 Run Locally with Docker Compose

Running the system containerized requires only Docker and Docker Compose. We provide two configurations:

### Option A: Standard Production-like Environment (Port 3000)
Builds the frontend static assets and serves them via Nginx, proxying API requests to the FastAPI backend container. The entire application runs on port `3000`.

```bash
docker-compose up --build
```
Once started:
- Access the web application at: [http://localhost:3000](http://localhost:3000)
- Access the API documentation at: [http://localhost:8080/docs](http://localhost:8080/docs) (Backend is mapped to port `8080`)

### Option B: Local Hot-Reloading Development Environment (Ports 3000 & 8080)
Runs Vite hot-reloading server and FastAPI reload server, mounting files as volumes.

```bash
docker-compose -f docker-compose.dev.yml up --build
```
Once started:
- Access the React dev UI at: [http://localhost:3000](http://localhost:3000)
- Access the FastAPI Swagger docs at: [http://localhost:8080/docs](http://localhost:8080/docs)

---

## 💻 Run Locally without Docker (SQLite Fallback)

If Docker is not installed on your machine, you can run the system using SQLite. The backend automatically switches to SQLite if no `DATABASE_URL` is provided.

### 1. Start the Backend API
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Seed the database with mock data:
   ```bash
   python seed.py
   ```
5. Run the FastAPI development server:
   ```bash
   python -m uvicorn main:app --reload --port 8080
   ```
   FastAPI will be running at [http://127.0.0.1:8080](http://127.0.0.1:8080).

### 2. Start the Frontend App
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the development server (configured to proxy requests to `http://localhost:8080` automatically):
   ```bash
   npm run dev
   ```
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

---

## ☁️ Deployment Guide (Free Tier Hosting)

To complete the assessment requirements, you can host the application using the following free platforms:

### 1. Database Deployment (Neon.tech or Supabase)
1. Sign up on [Neon.tech](https://neon.tech/) (free serverless PostgreSQL).
2. Create a new project and select PostgreSQL.
3. Copy the **Connection String** (URI format) which looks like:
   `postgresql://alex:password@ep-cool-shadow-12345.us-east-2.aws.neon.tech/neondb?sslmode=require`

### 2. Backend API Deployment (Render.com)
1. Sign up for a free account on [Render.com](https://render.com/).
2. Click **New** > **Web Service**.
3. Connect your GitHub repository.
4. Set the following details:
   - **Name**: `ethara-inventory-api`
   - **Language**: `Python`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment**, add:
   - `DATABASE_URL`: *[Paste your Neon connection string here]*
6. Click Deploy. Render will deploy the API and give you a public URL (e.g. `https://ethara-inventory-api.onrender.com`).

> [!NOTE]
> Since Render's free tier spins down on inactivity, the first API request after some time might take 30–50 seconds to boot up.

### 3. Frontend UI Deployment (Vercel or Netlify)
1. Sign up on [Vercel](https://vercel.com/).
2. Click **Add New** > **Project** and select your GitHub repository.
3. Configure the Project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Deploy. Vercel will give you a public URL (e.g. `https://ethara-inventory.vercel.app`).
5. **Configuring API Proxy**: Since Vercel serves static files, to connect to the deployed backend without CORS issues:
   - Option A: Change fetch calls in `frontend/src/App.jsx` to use your absolute deployed backend URL (e.g., replace `fetch('/...')` with `fetch('https://ethara-inventory-api.onrender.com/...')`). Ensure CORS is enabled on the backend for this origin.
   - Option B: Setup a `vercel.json` file in the `frontend` folder for url rewrites (already provided for you in the repository):
     ```json
     {
       "rewrites": [
         {
           "source": "/products/:path*",
           "destination": "https://ethara-inventory-api.onrender.com/products/:path*"
         },
         ...
       ]
     }
     ```

### 4. Build and Push Docker Images
To push your docker images to Docker Hub (for sharing public image links):
```bash
# Log in to Docker Hub
docker login

# Build backend image
docker build -t <your-docker-username>/ethara-backend:latest ./backend
# Push backend image
docker push <your-docker-username>/ethara-backend:latest

# Build frontend image (Note: updates App.jsx with deployed API url first if needed)
docker build -t <your-docker-username>/ethara-frontend:latest ./frontend
# Push frontend image
docker push <your-docker-username>/ethara-frontend:latest
```

---

## 📝 Submission Checklist

When submitting your assessment, prepare the following links:
1. **GitHub Repository**: Link to this repository.
2. **Docker Image Link**: Link to your public Docker Hub images.
3. **Live API Documentation URL**: E.g. `https://ethara-inventory-api.onrender.com/docs`
4. **Live Application URL**: E.g. `https://ethara-inventory.vercel.app`
