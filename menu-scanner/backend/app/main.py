import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import StructuredMenuResponse
from app.services.ocr_service import ocr_service
from app.services.vision_service import vision_service
from app.config import settings

app = FastAPI(title=settings.APP_NAME, version="1.0.0")

# Setup CORS to allow Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"status": "healthy", "service": settings.APP_NAME}

@app.post("/api/scan-menu", response_model=StructuredMenuResponse)
async def scan_menu(
    file: UploadFile = File(...), 
    scanMode: str = Form("semantic"),
    rawOcrText: str = Form(None)
):
    # 1. Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=400, detail="Only JPG, JPEG, PNG, and WEBP formats are supported.")
    
    # 2. Save uploaded file to temp path
    temp_file_path = os.path.join(TEMP_DIR, f"temp_{file.filename}")
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 3. Step 1: Use provided OCR text from frontend, or fallback to local backend OCR
        if rawOcrText and rawOcrText.strip():
            print("Using pre-computed OCR text from frontend browser...")
            raw_ocr_text = rawOcrText
            # Save for debugging
            try:
                with open("/Users/ritchie/Desktop/live website /posendwebsite/scratch/last_ocr_raw.txt", "w") as f:
                    f.write(raw_ocr_text)
            except Exception as err:
                print(f"Debug: failed to write OCR text: {err}")
        else:
            print("Running local backend OCR...")
            raw_ocr_text = ocr_service.extract_text(temp_file_path)
            
        # Save raw OCR text for debugging
        try:
            with open("/Users/ritchie/Desktop/live website /posendwebsite/scratch/last_ocr_raw.txt", "w") as f:
                f.write(raw_ocr_text)
        except Exception as err:
            print(f"Debug: failed to write raw OCR text: {err}")
            
        # 4. Step 2: Use Vision Model (Qwen2-VL) to extract organized structural layout
        structured_menu = await vision_service.extract_menu_structured(temp_file_path, raw_ocr_text, scanMode)
        
        return structured_menu
        
    except Exception as e:
        import traceback
        err_msg = f"Failed to process menu: {str(e)}\n{traceback.format_exc()}"
        print(err_msg)
        raise HTTPException(status_code=500, detail=err_msg)
        
    finally:
        # Cleanup temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
