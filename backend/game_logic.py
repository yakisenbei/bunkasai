import random
from typing import List, Tuple

ALL_EFFECTS = ["invert", "mosaic", "grayscale", "flip", "hide"]


def pick_effect_count(weights: List[float]) -> int:
    """0〜5 の効果個数を重み付きで抽選する。"""
    if len(weights) < 6:
        weights = list(weights) + [1.0] * (6 - len(weights))
    weights = [max(0.0, float(w)) for w in weights[:6]]
    total = sum(weights)
    if total <= 0:
        return random.randint(0, 5)
    r = random.uniform(0, total)
    acc = 0.0
    for n, w in enumerate(weights):
        acc += w
        if r <= acc:
            return n
    return 5


def pick_effects(n: int) -> List[str]:
    """候補から重複なしで n 個選ぶ。"""
    n = max(0, min(5, int(n)))
    if n == 0:
        return []
    pool = ALL_EFFECTS.copy()
    random.shuffle(pool)
    return pool[:n]


def draw_round(weights: List[float]) -> Tuple[int, List[str]]:
    count = pick_effect_count(weights)
    effects = pick_effects(count)
    return count, effects


def calc_score(n: int) -> int:
    n = max(0, min(5, int(n)))
    return round(1000 * (1.5**n))
