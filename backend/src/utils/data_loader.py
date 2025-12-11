# -*- coding: utf-8 -*-
"""
Data loading utilities for curriculum data.
"""

import json
from pathlib import Path
from typing import Any, Dict, List


def load_curriculum_data(file_path: str) -> List[Dict[str, Any]]:
    """
    Load curriculum data from JSON file.
    Accepts both dict with key "Matematik Kazanımları" or plain list.

    Yeni müfredatlar ("Türk Dili ve Edebiyatı Kazanımları" gibi) için de
    aynı şekilde çalışmaya devam eder; eğer JSON'da tek bir key varsa ve değeri listeyse,
    onu alır, aksi halde ya değişken key ya da direkt liste bekler.
    """
    raw_data = json.loads(Path(file_path).read_text(encoding="utf-8"))

    # Eski format: {"Matematik Kazanımları": [...]} şeklinde ise
    if isinstance(raw_data, dict):
        if "Matematik Kazanımları" in raw_data:
            return raw_data["Matematik Kazanımları"]

        # Yeni müfredatlar için: tek bir key varsa ve değeri listeyse onu kullan
        if len(raw_data) == 1:
            only_value = next(iter(raw_data.values()))
            if isinstance(only_value, list):
                return only_value

    return raw_data if isinstance(raw_data, list) else []


def validate_record(record: Dict[str, Any]) -> bool:
    """Validate if a record has the required fields."""
    return bool(record.get("id"))
