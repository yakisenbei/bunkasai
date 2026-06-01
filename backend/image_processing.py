import hashlib
import os
import subprocess
from typing import List, Optional

EFFECT_FILTERS = {
    "invert": "negate",
    "grayscale": "hue=s=0",
    "flip": "vflip",
    "mosaic": "scale=iw/16:ih/16:flags=neighbor,scale=iw*16:ih*16:flags=neighbor",
    "hide": "drawbox=x=iw/4:y=ih/4:w=iw/2:h=ih/2:color=black@0.9:t=fill",
}


def build_vf_chain(effects: List[str]) -> Optional[str]:
    parts = []
    for effect in effects:
        filt = EFFECT_FILTERS.get(effect)
        if filt:
            parts.append(filt)
    if not parts:
        return None
    return ",".join(parts)


def processed_filename(image_name: str, effects: List[str]) -> str:
    base, ext = os.path.splitext(image_name)
    if not ext:
        ext = ".jpg"
    key = f"{image_name}|{','.join(sorted(effects))}"
    digest = hashlib.md5(key.encode()).hexdigest()[:12]
    return f"{base}_{digest}{ext}"


def process_image(src_path: str, dst_path: str, effects: List[str]) -> None:
    vf = build_vf_chain(effects)
    cmd = ["ffmpeg", "-y", "-i", src_path]
    if vf:
        cmd += ["-vf", vf]
    cmd += [dst_path]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "ffmpeg failed")
