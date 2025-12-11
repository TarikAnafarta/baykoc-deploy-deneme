# -*- coding: utf-8 -*-
"""
Text processing utilities for the graph visualization.
Handles HTML escaping and label trimming.
"""

import html


def esc(x):
    """Escape HTML characters."""
    return html.escape("" if x is None else str(x))


def trim_label(s, maxlen):
    """Trim a label to a maximum length with ellipsis."""
    s = (s or "").strip()
    try:
        m = int(maxlen)
    except Exception:
        m = 32
    return s if len(s) <= m else s[: m - 1].rstrip() + "…"
