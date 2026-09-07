import zipfile
import io
import os

SUPPORTED_EXTENSIONS = {
    ".py", ".js", ".ts", ".java", ".php",
    ".go", ".rb", ".cs", ".cpp", ".c",
    ".jsx", ".tsx", ".vue", ".html", ".sql"
}

MAX_FILE_SIZE_BYTES  = 100_000   
MAX_TOTAL_CHARS      = 80_000    
MAX_FILES            = 30        


def extract_code_from_zip(zip_bytes: bytes) -> dict:
    """
    Extracts all readable source files from a ZIP archive.

    Returns:
        {
            "files":        { "path/file.py": "code content..." },
            "skipped":      ["file_too_large.py", ...],
            "total_files":  int,
            "total_chars":  int
        }
    """
    result        = {}
    skipped       = []
    total_chars   = 0
    files_read    = 0

    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
            entries = sorted(zf.namelist()) 

            for entry in entries:
                if entry.endswith("/"):
                    continue
                if any(part.startswith(".") or part.startswith("__")
                       for part in entry.split("/")):
                    continue
                if "node_modules" in entry or "venv" in entry:
                    continue

                _, ext = os.path.splitext(entry.lower())
                if ext not in SUPPORTED_EXTENSIONS:
                    continue

                if files_read >= MAX_FILES:
                    skipped.append(f"{entry} (max file limit reached)")
                    continue

                info = zf.getinfo(entry)
                if info.file_size > MAX_FILE_SIZE_BYTES:
                    skipped.append(f"{entry} (file too large: {info.file_size} bytes)")
                    continue

                try:
                    content = zf.read(entry).decode("utf-8", errors="replace")
                except Exception:
                    skipped.append(f"{entry} (decode error)")
                    continue

                if total_chars + len(content) > MAX_TOTAL_CHARS:
                    skipped.append(f"{entry} (total char limit reached)")
                    continue

                result[entry]   = content
                total_chars    += len(content)
                files_read     += 1

    except zipfile.BadZipFile:
        raise ValueError("Uploaded file is not a valid ZIP archive.")

    return {
        "files":       result,
        "skipped":     skipped,
        "total_files": files_read,
        "total_chars": total_chars
    }


def build_code_block(extracted: dict) -> str:
    """
    Concatenates all extracted files into a single formatted
    string to send to the model.
    """
    parts = []
    for filepath, content in extracted["files"].items():
        parts.append(f"### FILE: {filepath}\n```\n{content}\n```")
    return "\n\n".join(parts)
