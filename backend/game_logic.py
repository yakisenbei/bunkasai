import random
from typing import List, Optional, Tuple

ALL_EFFECTS = ["invert", "mosaic", "grayscale", "flip", "black_reveal"]

# ffmpeg では処理せずフロント側で描画する効果
FRONTEND_ONLY_EFFECTS = {"black_reveal"}


def normalize_enabled(enabled: Optional[List[str]]) -> List[str]:
    if not enabled:
        return ALL_EFFECTS.copy()
    return [e for e in enabled if e in ALL_EFFECTS]


def pick_effect_count(weights: List[float], max_count: int = 5) -> int:
    """0〜max_count の効果個数を重み付きで抽選する。"""
    max_count = max(0, min(5, int(max_count)))
    if len(weights) < 6:
        weights = list(weights) + [1.0] * (6 - len(weights))
    weights = [max(0.0, float(w)) for w in weights[:6]]
    # max_count 超の重みは使わない
    weights = weights[: max_count + 1] + [0.0] * max(0, 6 - (max_count + 1))
    total = sum(weights[: max_count + 1])
    if total <= 0:
        return random.randint(0, max_count)
    r = random.uniform(0, total)
    acc = 0.0
    for n, w in enumerate(weights[: max_count + 1]):
        acc += w
        if r <= acc:
            return n
    return max_count


def pick_effects(n: int, enabled: Optional[List[str]] = None) -> List[str]:
    """有効な候補から重複なしで n 個選ぶ。"""
    pool = normalize_enabled(enabled)
    if not pool or n <= 0:
        return []
    n = min(int(n), len(pool), 5)
    shuffled = pool.copy()
    random.shuffle(shuffled)
    return shuffled[:n]


def draw_round(
    weights: List[float],
    max_count: int = 5,
    enabled: Optional[List[str]] = None,
) -> Tuple[int, List[str]]:
    pool = normalize_enabled(enabled)
    max_count = max(0, min(5, int(max_count), len(pool) if pool else 0))
    count = pick_effect_count(weights, max_count)
    effects = pick_effects(count, pool)
    return len(effects), effects


def calc_score(n: int) -> int:
    n = max(0, min(5, int(n)))
    return round(1000 * (1.5**n))
