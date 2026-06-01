import hashlib
import os
import subprocess
from typing import List, Optional

STATIC_FILTERS = {
    "invert": "negate",
    "grayscale": "hue=s=0",
    "flip": "vflip",
}


def mosaic_filter(block_size: int) -> str:
    """block_size: モザイク1マスの辺のピクセル数（大きいほど粗い）。"""
    n = max(2, min(128, int(block_size)))
    return f"scale=iw/{n}:ih/{n}:flags=neighbor,scale=iw*{n}:ih*{n}:flags=neighbor"


def build_vf_chain(effects: List[str], mosaic_block_size: int = 16) -> Optional[str]:
    parts = []
    for effect in effects:
        if effect == "mosaic":
            parts.append(mosaic_filter(mosaic_block_size))
        elif effect in STATIC_FILTERS:
            parts.append(STATIC_FILTERS[effect])
    if not parts:
        return None
    return ",".join(parts)


def processed_filename(
    image_name: str, effects: List[str], mosaic_block_size: int = 16
) -> str:
    base, ext = os.path.splitext(image_name)
    if not ext:
        ext = ".jpg"
    key = f"{image_name}|{','.join(sorted(effects))}|m{mosaic_block_size}"
    digest = hashlib.md5(key.encode()).hexdigest()[:12]
    return f"{base}_{digest}{ext}"


def process_image(
    src_path: str,
    dst_path: str,
    effects: List[str],
    mosaic_block_size: int = 16,
) -> None:
    vf = build_vf_chain(effects, mosaic_block_size)
    cmd = ["ffmpeg", "-y", "-i", src_path]
    if vf:
        cmd += ["-vf", vf]
    cmd += [dst_path]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "ffmpeg failed")
