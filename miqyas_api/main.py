from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware  
from dotenv import load_dotenv

from extractor import extract_code_from_zip, build_code_block
from analyzer  import analyze_code

load_dotenv()

app = FastAPI(
    title       = "Miqyas API",
    description = "Static code analysis for Saudi government applications.",
    version     = "1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

@app.post(
    "/analyze",
    summary     = "Upload a ZIP file for Miqyas analysis",
    description = (
        "Upload a `.zip` archive containing your project source code. "
        "Miqyas will analyze it across Cybersecurity, Performance, "
        "Clean Code, and DGA Compliance pillars."
    ),
    tags=["Analysis"]
)
async def analyze_zip(
    file: UploadFile = File(..., description="ZIP archive of source code")
):

    if not file.filename.endswith(".zip"):
        raise HTTPException(
            status_code = 400,
            detail      = "Only .zip files are accepted."
        )

    
    zip_bytes = await file.read()

    if len(zip_bytes) == 0:
        raise HTTPException(
            status_code = 400,
            detail      = "Uploaded file is empty."
        )

    
    if len(zip_bytes) > 20 * 1024 * 1024:
        raise HTTPException(
            status_code = 413,
            detail      = "ZIP file exceeds 20 MB limit."
        )

    
    try:
        extracted = extract_code_from_zip(zip_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not extracted["files"]:
        raise HTTPException(
            status_code = 422,
            detail      = (
                "No supported source files found in the ZIP. "
                "Supported: .py .js .ts .java .php .go .rb .cs .cpp .c "
                ".jsx .tsx .vue .html .sql"
            )
        )

    
    code_block = build_code_block(extracted)

    
    try:
        result = analyze_code(code_block)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code = 500,
            detail      = f"Analysis failed: {str(e)}"
        )

    
    return JSONResponse(content={
        "status": "success",
        "meta": {
            "filename"    : file.filename,
            "files_read"  : extracted["total_files"],
            "total_chars" : extracted["total_chars"],
            "skipped"     : extracted["skipped"]
        },
        "analysis": result
    })


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "Miqyas API v1.0.0"}