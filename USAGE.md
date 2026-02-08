# Logistics Project Setup & Usage Guide

## 1. Prerequisites

Before running the project, you must have the following installed:

### PostgreSQL & PostGIS
This project requires a PostgreSQL database with the PostGIS extension for geospatial features.

1.  **Download & Install PostgreSQL**: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
    *   During installation, you will be asked to set a password for the `postgres` user.
    *   **Recommendation**: Set the password to `harihyma` to match the current project configuration.
    *   If you choose a different password, you will need to update `backend/.env` and `backend/create_db.py`.

2.  **Install PostGIS**:
    *   After PostgreSQL installation finishes, it will launch "Stack Builder".
    *   Select your PostgreSQL installation.
    *   Expand "Spatial Extensions" and check **PostGIS**.
    *   Complete the installation.

## 2. One-Time Setup

### Backend Setup
Open a terminal in the `backend` folder:

1.  **Initialize Database**:
    ```powershell
    # Make sure PostgreSQL is running first!
    .\venv\Scripts\python.exe create_db.py
    ```
    *This script creates the `logistics_db` and enables PostGIS.*

2.  **Verify Configuration**:
    Check `backend/.env` (if it exists) to ensure `DATABASE_URL` matches your credentials.
    Example: `postgresql+asyncpg://postgres:harihyma@localhost/logistics_db`

### Frontend Setup
Open a terminal in the `frontend` folder:

1.  **Install Dependencies** (If not done yet):
    ```powershell
    npm install
    ```

## 3. Running the Application

You need to run the Backend and Frontend in **separate terminals**.

### Terminal 1: Backend
```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn main:app --reload
```
*The API will start at `http://127.0.0.1:8000`*

### Terminal 2: Frontend
```powershell
cd frontend
npm run dev
```
*The UI will run at `http://localhost:5173` (or similar)*

## 4. Troubleshooting

*   **"Connection refused"**: Ensure PostgreSQL service is running. Search for "Services" in Windows, find "postgresql-x64-...", and Start it.
*   **"Authentication failed"**: Update the password in `backend/create_db.py` and `.env` to match what you set during installation.
