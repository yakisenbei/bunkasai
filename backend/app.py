import json
import os
from typing import List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from game_logic import ALL_EFFECTS, calc_score, draw_round, normalize_enabled
from image_processing import process_image, processed_filename

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(__file__)
IMAGES_DIR = os.path.join(BASE_DIR, "images")
PROCESSED_DIR = os.path.join(BASE_DIR, "processed")
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")

os.makedirs(IMAGES_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")
app.mount("/processed", StaticFiles(directory=PROCESSED_DIR), name="processed")


def load_config() -> dict:
    if not os.path.isfile(CONFIG_PATH):
        return {}
    with open(CONFIG_PATH, encoding="utf-8") as f:
        return json.load(f)


def save_config(data: dict) -> None:
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


class ProcessRequest(BaseModel):
    image_name: str
    effects: List[str] = Field(default_factory=list)
    focus_x: float = 0.5
    focus_y: float = 0.5
    mosaic_block_size: Optional[int] = None


class DrawRequest(BaseModel):
    weights: Optional[List[float]] = None
    max_effect_count: Optional[int] = None
    enabled_effects: Optional[List[str]] = None


class ConfigUpdate(BaseModel):
    effect_count_weights: Optional[List[float]] = None
    max_effect_count: Optional[int] = None
    enabled_effects: Optional[List[str]] = None
    mosaic_block_size: Optional[int] = None
    pre_shrink_countdown_sec: Optional[float] = None
    shrink_speed: Optional[float] = None
    initial_zoom: Optional[float] = None
    min_zoom: Optional[float] = None


@app.get("/api/images")
async def list_images():
    files = sorted(
        f
        for f in os.listdir(IMAGES_DIR)
        if os.path.isfile(os.path.join(IMAGES_DIR, f))
        and not f.startswith(".")
    )
    return {"images": files}


@app.get("/api/config")
async def get_config():
    return load_config()


@app.put("/api/config")
async def put_config(body: ConfigUpdate):
    cfg = load_config()
    data = body.model_dump(exclude_none=True)
    cfg.update(data)
    save_config(cfg)
    return cfg


@app.get("/api/effects")
async def list_effects():
    return {"effects": ALL_EFFECTS}


@app.post("/api/round/draw")
async def round_draw(body: DrawRequest):
    cfg = load_config()
    weights = body.weights or cfg.get("effect_count_weights", [1] * 6)
    max_count = body.max_effect_count if body.max_effect_count is not None else cfg.get("max_effect_count", 5)
    enabled = body.enabled_effects or cfg.get("enabled_effects")
    n, effects = draw_round(weights, max_count, enabled)
    return {
        "effect_count": n,
        "effects": effects,
        "score_if_correct": calc_score(n),
    }


@app.post("/api/process")
async def process_image_endpoint(body: ProcessRequest):
    src = os.path.join(IMAGES_DIR, body.image_name)
    if not os.path.exists(src):
        return JSONResponse({"error": "not found"}, status_code=404)

    invalid = [e for e in body.effects if e not in ALL_EFFECTS]
    if invalid:
        return JSONResponse({"error": f"unknown effects: {invalid}"}, status_code=400)

    cfg = load_config()
    mosaic_size = body.mosaic_block_size if body.mosaic_block_size is not None else cfg.get("mosaic_block_size", 16)

    out_name = processed_filename(body.image_name, body.effects, mosaic_size)
    dst = os.path.join(PROCESSED_DIR, out_name)

    if not os.path.exists(dst):
        try:
            process_image(src, dst, body.effects, mosaic_size)
        except RuntimeError as exc:
            return JSONResponse({"error": str(exc)}, status_code=500)

    return {
        "processed_url": f"/processed/{out_name}",
        "focus_x": body.focus_x,
        "focus_y": body.focus_y,
    }


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        try:
            self.active_connections.remove(websocket)
        except ValueError:
            pass

    async def broadcast(self, message: str):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                pass


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
