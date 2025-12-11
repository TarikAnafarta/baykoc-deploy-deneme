# -*- coding: utf-8 -*-
"""
Color utilities for the graph visualization.
Handles color interpolation and score-to-color mapping.
"""

from typing import Tuple


def clamp01(x: float) -> float:
    """Clamp a value between 0 and 1.
    Accepts any number-like input; returns 0..1 float.
    """
    try:
        v = float(x)
    except Exception:
        return 0.0
    return 0.0 if v < 0.0 else 1.0 if v > 1.0 else v


def _hex_to_rgb(c: str) -> Tuple[int, int, int]:
    c = c.lstrip("#")
    return int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)


def _rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{r:02x}{g:02x}{b:02x}"


def hex_interp(c1: str, c2: str, t: float) -> str:
    """Interpolate between two hex colors.
    t in [0,1].
    """
    r1, g1, b1 = _hex_to_rgb(c1)
    r2, g2, b2 = _hex_to_rgb(c2)
    t = clamp01(t)
    r = int(r1 + (r2 - r1) * t)
    g = int(g1 + (g2 - g1) * t)
    b = int(b1 + (b2 - b1) * t)
    return _rgb_to_hex(r, g, b)


def score_to_color(score: float) -> str:
    """Convert a score (0..1) to a color along red->yellow->green ramp."""
    s = clamp01(score)
    # 0..0.5: red -> yellow, 0.5..1: yellow -> green
    if s <= 0.5:
        return hex_interp("#e53935", "#ffb300", s / 0.5)
    return hex_interp("#ffb300", "#00c853", (s - 0.5) / 0.5)


# Type colors for different node types
TYPE_COLORS = {
    "konu": "#1976d2",
    "grup": "#8e24aa",
    "alt_grup": "#00897b",
    "kazanım": None,
}

# Base radius for different node types
TYPE_BASE_RADIUS = {
    "konu": 44,
    "grup": 30,
    "alt_grup": 22,
    "kazanım": 10,
}
