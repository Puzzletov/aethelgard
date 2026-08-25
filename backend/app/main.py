from fastapi import FastAPI


app = FastAPI(title="Aethelgard API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "aethelgard-api"}
