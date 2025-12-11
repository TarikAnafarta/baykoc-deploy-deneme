# -*- coding: utf-8 -*-
"""
API Views for BayKoç curriculum graph visualization.
"""
from __future__ import annotations

import json
import logging
import os
from collections.abc import Iterable
from datetime import date
from pathlib import Path
from typing import Any

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from src.utils import create_graph_data, load_curriculum_data

# Try to import Groq client; if missing, disable chat gracefully
try:
    from groq import Groq  # type: ignore
except Exception:  # pragma: no cover - defensive import
    Groq = None  # type: ignore[misc,assignment]

CURRICULUM_ROOT = Path(settings.CURRICULUM_DIR)
CACHE_TIMEOUT_SECONDS = 60 * 60  # 1 hour caching window per curriculum file
SOURCES_CACHE_KEY = "graph-sources:data"
SOURCES_SIG_KEY = "graph-sources:sig"
MAX_CHAT_MESSAGES = 12  # keep history small to avoid bloated sessions
GraphData = tuple[list[dict[str, Any]], list[dict[str, Any]]]

logger = logging.getLogger(__name__)


def get_cached_graph_data(file_path: str) -> GraphData:
    """Load graph data from cache or rebuild from disk when missing."""

    cache_key = f"graph-data:{file_path}"
    cached: GraphData | None = cache.get(cache_key)
    if cached is not None:
        logger.info(
            "graph-data cache hit", extra={"file": file_path, "cache_key": cache_key}
        )
        return cached

    records = load_curriculum_data(file_path)
    graph_data = create_graph_data(records)
    cache.set(cache_key, graph_data, CACHE_TIMEOUT_SECONDS)
    logger.info(
        "graph-data cache miss — rebuilt",
        extra={
            "file": file_path,
            "cache_key": cache_key,
            "node_count": len(graph_data[0]),
            "link_count": len(graph_data[1]),
        },
    )
    return graph_data


def _slugify(label: str) -> str:
    return str(label).strip().lower().replace(" ", "-").replace("/", "-")


def _parse_grade_param(raw: str | None) -> set[int]:
    allowed: set[int] = set()
    if not raw:
        return allowed
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        try:
            allowed.add(int(part))
        except ValueError:
            continue
    return allowed


def _graph_payload_cache_key(
    data_file: Path,
    subject: str | None,
    grades: set[int],
    filter_type: str | None,
    filter_slug: str | None,
) -> str:
    try:
        stat = data_file.stat()
        file_sig = f"{int(stat.st_mtime)}:{stat.st_size}"
    except OSError:
        file_sig = "unknown"
    subject_sig = subject or "matematik"
    grade_sig = ",".join(str(g) for g in sorted(grades)) if grades else "-"
    filter_sig = f"{filter_type or 'all'}:{filter_slug or '-'}"
    return f"graph-payload:{subject_sig}:{data_file.name}:{file_sig}:{grade_sig}:{filter_sig}"


def _curriculum_signature() -> str:
    parts: list[str] = []
    if not CURRICULUM_ROOT.exists() or not CURRICULUM_ROOT.is_dir():
        return ""
    for subject_dir in sorted(CURRICULUM_ROOT.iterdir()):
        if not subject_dir.is_dir():
            continue
        for json_path in sorted(subject_dir.glob("*.json")):
            try:
                stat = json_path.stat()
            except OSError:
                continue
            parts.append(
                f"{subject_dir.name}:{json_path.name}:{int(stat.st_mtime)}:{stat.st_size}"
            )
    return "|".join(parts)


def _discover_graph_sources() -> dict[str, list[dict[str, str]]]:
    """Discover available subjects and topics (konular) from curriculum JSON files.

    For each subject directory under CURRICULUM_ROOT, we load its JSON files and
    extract top-level topic labels from nodes where node_type == "konu".
    The keys in the returned dict are subject folder names, and the values are
    sorted unique konu objects with both slug and human‑readable label.
    """

    signature = _curriculum_signature()
    cached = cache.get(SOURCES_CACHE_KEY)
    cached_sig = cache.get(SOURCES_SIG_KEY)
    if cached is not None and cached_sig == signature:
        logger.info(
            "graph-sources cache hit",
            extra={"signature": signature, "subject_count": len(cached)},
        )
        return cached

    sources: dict[str, list[dict[str, str]]] = {}

    if not CURRICULUM_ROOT.exists() or not CURRICULUM_ROOT.is_dir():
        return {}

    for subject_dir in CURRICULUM_ROOT.iterdir():
        if not subject_dir.is_dir():
            continue
        subject_key = subject_dir.name
        # {slug: {slug, label}}
        konu_map: dict[str, dict[str, str]] = {}
        for json_path in subject_dir.glob("*.json"):
            try:
                nodes, _ = get_cached_graph_data(str(json_path))
            except Exception:
                # skip broken files but continue scanning others
                continue
            for node in nodes:
                if node.get("type") == "konu" or node.get("node_type") == "konu":
                    label = node.get("label") or node.get("name") or ""
                    if not label:
                        continue
                    slug = _slugify(label)
                    if not slug:
                        continue
                    # Aynı slug icin ilk gordugumuz label'i koru (insan okunur Turkce ad)
                    if slug not in konu_map:
                        konu_map[slug] = {"slug": slug, "label": str(label)}
        if konu_map:
            # frontend icin stabil bir siralama saglamak adina label'a gore siraliyoruz
            sorted_list = sorted(konu_map.values(), key=lambda x: x["label"].lower())
            sources[subject_key] = sorted_list

    cache.set(SOURCES_CACHE_KEY, sources, CACHE_TIMEOUT_SECONDS)
    cache.set(SOURCES_SIG_KEY, signature, CACHE_TIMEOUT_SECONDS)
    logger.info(
        "graph-sources cache miss — rebuilt",
        extra={"signature": signature, "subject_count": len(sources)},
    )
    return sources


def _resolve_curriculum_file(
    subject: str | None = None, filename: str | None = None
) -> Path:
    """Resolve curriculum JSON path based on subject and konu.

    If no subject is provided, defaults to "matematik".
    If no konu is provided, we fall back to the legacy
    matematik_kazanimlari_124_154.json if present or the first JSON file.

    For now, konu is not used to select a specific file; the file-level layout
    remains the same. Filtering by konu is done after loading the nodes.
    """

    base = CURRICULUM_ROOT
    subject = subject or "matematik"
    subject_dir = base / subject
    if not subject_dir.exists() or not subject_dir.is_dir():
        raise FileNotFoundError(f"Curriculum subject '{subject}' not found")

    if filename:
        candidate = subject_dir / filename
        if candidate.exists():
            return candidate
        raise FileNotFoundError(
            f"Curriculum file '{filename}' not found for subject '{subject}'"
        )

    # Legacy default for matematik
    legacy = subject_dir / "matematik_kazanimlari.json"
    if legacy.exists():
        return legacy

    # Otherwise pick the first json file
    for path in subject_dir.glob("*.json"):
        return path

    raise FileNotFoundError(f"No curriculum JSON found for subject '{subject}'")


def _collect_descendants(
    nodes: list[dict[str, Any]],
    links: list[dict[str, Any]],
    root_ids: Iterable[Any],
) -> GraphData:
    """Collect all descendants of given root_ids using links source/target."""

    children_map: dict[Any, set[Any]] = {}
    for link in links:
        src = link.get("source")
        tgt = link.get("target")
        if src is None or tgt is None:
            continue
        children_map.setdefault(src, set()).add(tgt)

    keep_ids = set()
    stack = list(root_ids)
    while stack:
        cur = stack.pop()
        if cur in keep_ids:
            continue
        keep_ids.add(cur)
        for child in children_map.get(cur, []):
            if child not in keep_ids:
                stack.append(child)

    id_to_node = {n["id"]: n for n in nodes}
    filtered_nodes = [n for nid, n in id_to_node.items() if nid in keep_ids]
    filtered_links = [
        link
        for link in links
        if link.get("source") in keep_ids and link.get("target") in keep_ids
    ]
    return filtered_nodes, filtered_links


def _collect_subgraph(
    nodes: list[dict[str, Any]],
    links: list[dict[str, Any]],
    seed_ids: Iterable[Any],
) -> GraphData:
    """Collect subgraph containing given nodes plus all ancestors and descendants."""

    children_map: dict[Any, set[Any]] = {}
    parent_map: dict[Any, set[Any]] = {}
    for link in links:
        src = link.get("source")
        tgt = link.get("target")
        if src is None or tgt is None:
            continue
        children_map.setdefault(src, set()).add(tgt)
        parent_map.setdefault(tgt, set()).add(src)

    keep_ids: set[Any] = set()
    stack = list(seed_ids)
    while stack:
        cur = stack.pop()
        if cur in keep_ids:
            continue
        keep_ids.add(cur)
        stack.extend(children_map.get(cur, ()))
        stack.extend(parent_map.get(cur, ()))

    if not keep_ids:
        return [], []

    id_to_node = {n["id"]: n for n in nodes}
    filtered_nodes = [id_to_node[nid] for nid in keep_ids if nid in id_to_node]
    filtered_links = [
        link
        for link in links
        if link.get("source") in keep_ids and link.get("target") in keep_ids
    ]
    return filtered_nodes, filtered_links


def _filter_by_grade(
    nodes: list[dict[str, Any]],
    links: list[dict[str, Any]],
    allowed_grades: set[int],
) -> GraphData:
    if not allowed_grades:
        return nodes, links

    id_to_node = {n["id"]: n for n in nodes if "id" in n}
    matching_ids = {
        nid for nid, node in id_to_node.items() if node.get("sinif") in allowed_grades
    }
    if not matching_ids:
        return nodes, links
    return _collect_subgraph(nodes, links, matching_ids)


def _extract_score(node: dict[str, Any]) -> float:
    raw = (
        node.get("basari_puani")
        or node.get("basari")
        or node.get("kazanim_basarisi")
        or node.get("success")
        or node.get("score")
        or node.get("puan")
        or node.get("value")
        or 0
    )
    try:
        return float(raw)
    except Exception:  # pragma: no cover - defensive casting
        return 0.0


def _summarize_graph_payload(payload: dict[str, Any] | None) -> dict[str, Any] | None:
    if not isinstance(payload, dict):
        return None
    if {"stats", "best_nodes", "worst_nodes"}.issubset(payload.keys()):
        return payload

    nodes = payload.get("nodes")
    links = payload.get("links")
    if not isinstance(nodes, list) or not isinstance(links, list):
        return None

    best_nodes = sorted(nodes, key=lambda n: _extract_score(n), reverse=True)[:5]
    worst_nodes = sorted(nodes, key=_extract_score)[:5]

    return {
        "filters": payload.get("filters", {}),
        "stats": {
            "node_count": len(nodes),
            "link_count": len(links),
        },
        "best_nodes": [
            {
                "label": node.get("label") or node.get("name") or node.get("id"),
                "score": _extract_score(node),
            }
            for node in best_nodes
        ],
        "worst_nodes": [
            {
                "label": node.get("label") or node.get("name") or node.get("id"),
                "score": _extract_score(node),
            }
            for node in worst_nodes
        ],
    }


def _graph_summary_to_text(summary: dict[str, Any]) -> str:
    filters = summary.get("filters") or {}
    stats = summary.get("stats") or {}
    subject = filters.get("subject") or "(seçilmemiş)"
    konu = filters.get("konu") or "(seçilmemiş)"
    node_count = stats.get("node_count", 0)
    link_count = stats.get("link_count", 0)

    def _fmt(nodes_subset: list[dict[str, Any]]) -> str:
        if not nodes_subset:
            return "-"
        parts = []
        for node in nodes_subset:
            label = node.get("label") or node.get("name") or "?"
            score = _extract_score(node)
            parts.append(f"{label} (başarı: {score:.2f})")
        return ", ".join(parts)

    return (
        "Öğrencinin şu an ekranda gördüğü grafik bağlamı:\n"
        f"- Ders (subject): {subject}\n"
        f"- Konu filtresi (konu): {konu}\n"
        f"- Toplam node sayısı: {node_count}, bağlantı sayısı: {link_count}\n"
        f"- En yüksek başarı puanına sahip konular: {_fmt(summary.get('best_nodes', []))}\n"
        f"- En düşük başarı puanına sahip konular: {_fmt(summary.get('worst_nodes', []))}\n"
    )


def _trim_chat_history(history: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not history:
        return history
    system_prompt = history[0]
    tail = history[1:]
    if len(tail) > MAX_CHAT_MESSAGES:
        tail = tail[-MAX_CHAT_MESSAGES:]
    return [system_prompt, *tail]


@method_decorator(csrf_exempt, name="dispatch")
class GraphSourcesAPIView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request: Request) -> Response:
        """Return available graph sources.

        If no filter params are provided, returns discovered subjects and their topics
        using the fast filesystem-based scanner. If subject/konu/grup/alt_grup/grade
        params are provided, loads the corresponding curriculum JSON, applies the
        same hierarchical filters as GraphDataAPIView, and derives distinct
        konu/grup/alt_grup option lists from the filtered nodes.
        """

        subject = request.query_params.get("subject")
        konu = request.query_params.get("konu")
        grup = request.query_params.get("grup")
        alt_grup = request.query_params.get("alt_grup")
        grade_param = request.query_params.get("grade")

        # Fast path: no filters at all -> filesystem discovery only
        if not any([subject, konu, grup, alt_grup, grade_param]):
            sources = _discover_graph_sources()
            return Response(sources, status=status.HTTP_200_OK)

        # Filtered path: behave similarly to GraphDataAPIView but only return option lists
        if not subject:
            return Response(
                {"detail": "subject parametresi zorunludur."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            data_file = _resolve_curriculum_file(subject, None)
            nodes, links = get_cached_graph_data(str(data_file))

            # Grade filter (same logic as GraphDataAPIView)
            allowed = _parse_grade_param(grade_param)
            if allowed:
                nodes, links = _filter_by_grade(nodes, links, allowed)

            # Hierarchical filter: prefer alt_grup > grup > konu
            filter_slug = None
            filter_type = None
            if alt_grup:
                filter_slug = alt_grup
                filter_type = "alt_grup"
            elif grup:
                filter_slug = grup
                filter_type = "grup"
            elif konu:
                filter_slug = konu
                filter_type = "konu"

            if filter_slug:
                root_ids = [
                    n["id"]
                    for n in nodes
                    if (
                        (
                            n.get("type") == filter_type
                            or n.get("node_type") == filter_type
                        )
                        and _slugify(n.get("label") or n.get("name") or "")
                        == filter_slug
                    )
                ]
                if root_ids:
                    nodes, links = _collect_descendants(nodes, links, root_ids)

            # Derive option lists from filtered nodes
            konu_map: dict[str, dict[str, str]] = {}
            grup_map: dict[str, dict[str, str]] = {}
            alt_grup_map: dict[str, dict[str, str]] = {}

            for n in nodes:
                label = n.get("label") or n.get("name") or ""
                if not label:
                    continue
                slug = _slugify(label)
                if not slug:
                    continue
                t = n.get("type") or n.get("node_type")
                if t == "konu":
                    if slug not in konu_map:
                        konu_map[slug] = {"slug": slug, "label": str(label)}
                elif t == "grup":
                    if slug not in grup_map:
                        grup_map[slug] = {"slug": slug, "label": str(label)}
                elif t == "alt_grup":
                    if slug not in alt_grup_map:
                        alt_grup_map[slug] = {"slug": slug, "label": str(label)}

            konular = sorted(konu_map.values(), key=lambda x: x["label"].lower())
            gruplar = sorted(grup_map.values(), key=lambda x: x["label"].lower())
            alt_gruplar = sorted(
                alt_grup_map.values(), key=lambda x: x["label"].lower()
            )

            return Response(
                {
                    "subject": subject,
                    "konular": konular,
                    "gruplar": gruplar,
                    "alt_gruplar": alt_gruplar,
                },
                status=status.HTTP_200_OK,
            )

        except FileNotFoundError as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            return Response(
                {
                    "detail": "Graph kaynakları hesaplanırken bir hata oluştu.",
                    "error": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(csrf_exempt, name="dispatch")
class GraphDataAPIView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request: Request) -> Response:
        subject = request.query_params.get("subject")
        konu = request.query_params.get("konu")  # slug or empty
        grup = request.query_params.get("grup")  # slug or empty
        alt_grup = request.query_params.get("alt_grup")  # slug or empty
        grade_param = request.query_params.get("grade")  # "9,10,11" gibi olabilir

        filter_slug = None
        filter_type = None
        if alt_grup:
            filter_slug = alt_grup
            filter_type = "alt_grup"
        elif grup:
            filter_slug = grup
            filter_type = "grup"
        elif konu:
            filter_slug = konu
            filter_type = "konu"

        try:
            data_file = _resolve_curriculum_file(
                subject, request.query_params.get("file")
            )
            allowed = _parse_grade_param(grade_param)
            cache_key = _graph_payload_cache_key(
                data_file, subject, allowed, filter_type, filter_slug
            )

            cached_payload = cache.get(cache_key)
            if cached_payload is not None:
                logger.info(
                    "graph-payload cache hit",
                    extra={"cache_key": cache_key, "subject": subject or "matematik"},
                )
                return Response({"data": cached_payload}, status=status.HTTP_200_OK)

            nodes, links = get_cached_graph_data(str(data_file))

            if allowed:
                nodes, links = _filter_by_grade(nodes, links, allowed)

            konular = [
                {
                    "id": n["id"],
                    "label": n.get("label") or n.get("name") or "",
                    "slug": _slugify(n.get("label") or n.get("name") or ""),
                }
                for n in nodes
                if n.get("type") == "konu" or n.get("node_type") == "konu"
            ]

            if filter_slug:
                root_ids = [
                    n["id"]
                    for n in nodes
                    if (
                        (
                            n.get("type") == filter_type
                            or n.get("node_type") == filter_type
                        )
                        and _slugify(n.get("label") or n.get("name") or "")
                        == filter_slug
                    )
                ]
                if root_ids:
                    nodes, links = _collect_descendants(nodes, links, root_ids)

            node_types: dict[str, int] = {}
            for node in nodes:
                t = node.get("type") or node.get("node_type") or "unknown"
                node_types[t] = node_types.get(t, 0) + 1

            # Backwards-compatible response shape for existing clients/tests:
            # top-level data{} with subject, file, nodes, links, node_types, konular
            payload = {
                "subject": subject,
                "file": data_file.name,
                "nodes": nodes,
                "links": links,
                "node_types": node_types,
                "konular": konular,
            }
            cache.set(cache_key, payload, CACHE_TIMEOUT_SECONDS)
            logger.info(
                "graph-payload cache miss — rebuilt",
                extra={
                    "cache_key": cache_key,
                    "subject": subject or "matematik",
                    "node_count": len(nodes),
                    "link_count": len(links),
                    "grades": sorted(list(allowed)) if allowed else [],
                    "filter_type": filter_type,
                    "filter_slug": filter_slug,
                },
            )
            return Response({"data": payload}, status=status.HTTP_200_OK)

        except FileNotFoundError as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            return Response(
                {
                    "detail": "Graph verisi yüklenirken bir hata oluştu.",
                    "error": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(csrf_exempt, name="dispatch")
class GraphNodesAPIView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request: Request) -> Response:
        subject = request.query_params.get("subject")
        filename = request.query_params.get("file")
        node_type_filter = request.query_params.get("type")
        try:
            data_file = _resolve_curriculum_file(subject, filename)
            nodes, _ = get_cached_graph_data(str(data_file))
            if node_type_filter:
                nodes = [n for n in nodes if n.get("type") == node_type_filter]
            return Response(nodes, status=status.HTTP_200_OK)
        except FileNotFoundError as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            return Response(
                {
                    "detail": "Graph düğümleri yüklenirken bir hata oluştu.",
                    "error": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(csrf_exempt, name="dispatch")
class GraphLinksAPIView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request: Request) -> Response:
        subject = request.query_params.get("subject")
        filename = request.query_params.get("file")
        try:
            data_file = _resolve_curriculum_file(subject, filename)
            _, links = get_cached_graph_data(str(data_file))
            return Response(links, status=status.HTTP_200_OK)
        except FileNotFoundError as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            return Response(
                {
                    "detail": "Graph bağlantıları yüklenirken bir hata oluştu.",
                    "error": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(csrf_exempt, name="dispatch")
class GraphStatsAPIView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request: Request) -> Response:
        subject = request.query_params.get("subject")
        filename = request.query_params.get("file")
        try:
            data_file = _resolve_curriculum_file(subject, filename)
            nodes, links = get_cached_graph_data(str(data_file))
            node_count = len(nodes)
            link_count = len(links)
            node_types: dict[str, int] = {}
            for node in nodes:
                t = node.get("type") or node.get("node_type") or "unknown"
                node_types[t] = node_types.get(t, 0) + 1
            return Response(
                {
                    "node_count": node_count,
                    "link_count": link_count,
                    "node_types": node_types,
                },
                status=status.HTTP_200_OK,
            )
        except FileNotFoundError as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            return Response(
                {
                    "detail": "Graph istatistikleri hesaplanırken bir hata oluştu.",
                    "error": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


SYSTEM_PROMPT = (
    "Sen bilgiyi sade ve anlaşılır şekilde açıklayan bir öğretmensin. Senin adın BayKoç AI. "
    "Öğrencinin önündeki müfredat grafiğini ve başarı durumunu dikkate alarak "
    "öğrenme yolculuğunu planlamasına yardım edersin. "
    "Önce hangi konularda zorlandığını anlamaya çalışır, sonra adım adım, "
    "somut örneklerle anlatırsın. Yanlış bir ifade görürsen nazikçe düzeltirsin."
)


# Groq istemcisini sadece paket ve API anahtarı mevcutsa başlat
if Groq is not None and os.getenv("GROQ_API_KEY"):
    groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
else:
    groq_client = None


@method_decorator(csrf_exempt, name="dispatch")
class ChatbotAPIView(APIView):
    """Kullanıcının sorusunu ve o anki grafik görünümünü Groq modeline ileten sohbet endpoint'i.

    groq paketi veya API anahtarı yoksa, HTTP 503 ile zarifçe devre dışı kalır.
    """

    permission_classes = (AllowAny,)

    def post(self, request):
        if groq_client is None:
            return JsonResponse(
                {
                    "error": "AI sohbet servisi şu anda etkin değil. Lütfen daha sonra tekrar deneyin.",
                },
                status=503,
            )

        try:
            body = json.loads(request.body or b"{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON body"}, status=400)

        user_message = body.get("message")
        graph_payload = body.get("graph")  # summarized graph context from frontend

        if not user_message:
            return JsonResponse({"error": "Message field is required"}, status=400)

        # Session'da mesaj geçmişi yoksa oluştur
        if "chat_history" not in request.session:
            request.session["chat_history"] = [
                {"role": "system", "content": SYSTEM_PROMPT}
            ]

        chat_history = request.session["chat_history"]

        # Grafiği özetleyip kullanıcı mesajına ek context olarak işliyoruz
        enriched_user_message = user_message
        summary = _summarize_graph_payload(graph_payload)
        if summary:
            graph_text = _graph_summary_to_text(summary)
            enriched_user_message = (
                graph_text + "\n\nKullanıcının sorusu:\n" + str(user_message)
            )

        # Yeni kullanıcı mesajını ekle
        chat_history.append({"role": "user", "content": enriched_user_message})
        chat_history = _trim_chat_history(chat_history)

        try:
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=chat_history,
                temperature=0.4,
                top_p=0.9,
                max_tokens=500,
            )
        except Exception as exc:  # Groq tarafındaki hata
            return JsonResponse(
                {
                    "error": "AI servisiyle iletişim kurulurken bir hata oluştu.",
                    "detail": str(exc),
                },
                status=502,
            )

        choice = response.choices[0]
        content = getattr(choice, "message", None)
        if isinstance(content, dict):
            assistant_reply = content.get("content", "")
        else:
            assistant_reply = getattr(content, "content", "") or ""

        if not assistant_reply:
            assistant_reply = "Şu anda net bir yanıt oluşturamadım, sorunu biraz daha ayrıntılı anlatabilir misin?"

        # Yanıtı geçmişe ekle
        chat_history.append({"role": "assistant", "content": assistant_reply})
        chat_history = _trim_chat_history(chat_history)
        request.session["chat_history"] = chat_history

        return JsonResponse({"reply": assistant_reply})

    def get(self, request):
        return JsonResponse({"error": "Only POST allowed"}, status=405)


@method_decorator(csrf_exempt, name="dispatch")
class AnalyticsProgressAPIView(APIView):
    """Return simple analytics snapshot for the selected subject/konu.

    - timeline: list of {date, average_success} with values in [0, 100]
    - kazanims: list of {id, label, success} for kazanım nodes

    This uses the existing curriculum JSON and basari_puani fields.
    """

    permission_classes = (AllowAny,)

    def get(self, request: Request) -> Response:
        subject = request.query_params.get("subject")
        konu = request.query_params.get("konu")  # slug or empty

        try:
            data_file = _resolve_curriculum_file(
                subject, request.query_params.get("file")
            )
            nodes, links = get_cached_graph_data(str(data_file))
        except FileNotFoundError as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:  # pragma: no cover - defensive
            return Response(
                {
                    "detail": "Analitik verisi hesaplanırken bir hata oluştu.",
                    "error": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        def _slugify_label(label: str) -> str:
            return str(label).strip().lower().replace(" ", "-").replace("/", "-")

        # Optionally filter to a specific konu/grup/alt_grup tree
        if konu:
            root_ids = [
                n["id"]
                for n in nodes
                if (
                    (
                        n.get("type") in ("konu", "grup", "alt_grup")
                        or n.get("node_type") in ("konu", "grup", "alt_grup")
                    )
                    and _slugify_label(n.get("label") or n.get("name") or "") == konu
                )
            ]
            if root_ids:
                nodes, links = _collect_descendants(nodes, links, root_ids)

        kazanims: list[dict] = []
        for n in nodes:
            if (n.get("type") == "kazanım") or (n.get("node_type") == "kazanım"):
                raw = (
                    n.get("basari_puani")
                    or n.get("basari")
                    or n.get("kazanim_basarisi")
                    or n.get("success")
                    or n.get("score")
                    or n.get("puan")
                    or n.get("value")
                    or 0
                )
                try:
                    val = float(raw)
                except Exception:  # pragma: no cover - safety
                    val = 0.0
                success = max(0.0, min(100.0, val))
                kazanims.append(
                    {
                        "id": n["id"],
                        "label": n.get("label") or n.get("name") or "Kazanım",
                        "success": success,
                    }
                )

        if kazanims:
            avg = sum(k["success"] for k in kazanims) / float(len(kazanims))
        else:
            avg = 0.0

        today_str = date.today().isoformat()

        payload = {
            "timeline": [
                {
                    "date": today_str,
                    "average_success": avg,
                }
            ],
            "kazanims": kazanims,
        }
        return Response(payload, status=status.HTTP_200_OK)
