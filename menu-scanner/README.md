# AI-Powered Restaurant Menu Scanner

A production-ready, 100% local, and API-key-free Restaurant Menu Scanner system. It extracts categories, items, prices, descriptions, vegetarian status, spicy markings, and automatically predicts the corresponding GST rate and HSN code according to Indian tax guidelines.

## Features
- **Drag-and-drop Image Upload**: Upload menu images in JPG, PNG, or WEBP format.
- **Local OCR Integration**: Utilizes `EasyOCR` locally for raw text parsing.
- **Local Vision AI**: Utilizes `Qwen2-VL` (running on Ollama) locally to understand the layout and return structured JSON.
- **Tax Classification**: Automatic inference of GST rates (e.g. 5% for cooked food, 18% for beverages) and HSN codes (e.g. 9963 for food service, 2202 for non-alcoholic beverages).
- **Glassmorphic UI**: Sleek, interactive dashboard using React, Next.js, and Tailwind CSS.
- **Docker Support**: Containerized services with `docker-compose`.

---

## Getting Started

### 1. Prerequisites
Install the following on your machine:
- [Ollama](https://ollama.com/)
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose (Optional, if running via containers)

### 2. Setup Ollama & Local Model
Run the following command to download and run the Qwen2-VL model locally:
```bash
ollama run qwen2-vl
```
Ensure Ollama is running at `http://localhost:11434`.

---

### 3. Running Backend Locally
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate # Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

### 4. Running Frontend Locally
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm modules:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

### 5. Running via Docker Compose
Simply run:
```bash
docker-compose up --build
```
This boots:
- Next.js frontend at `http://localhost:3000`
- FastAPI backend at `http://localhost:8000`
- Local Ollama container at `http://localhost:11434`
*(Note: To download the model inside the Ollama container, run: `docker exec -it menu-scanner-ollama-1 ollama run qwen2-vl`)*
