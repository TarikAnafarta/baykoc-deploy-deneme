# -*- coding: utf-8 -*-
"""
URL configuration for the artifacts (graph) API.
"""

from django.urls import path

from .views import (
    AnalyticsProgressAPIView,
    ChatbotAPIView,
    GraphDataAPIView,
    GraphLinksAPIView,
    GraphNodesAPIView,
    GraphSourcesAPIView,
    GraphStatsAPIView,
)

app_name = "artifacts"

urlpatterns = [
    # API endpoints
    path("graph/data/", GraphDataAPIView.as_view(), name="graph-data"),
    path("graph/nodes/", GraphNodesAPIView.as_view(), name="graph-nodes"),
    path("graph/links/", GraphLinksAPIView.as_view(), name="graph-links"),
    path("graph/stats/", GraphStatsAPIView.as_view(), name="graph-stats"),
    path("graph/sources/", GraphSourcesAPIView.as_view(), name="graph-sources"),
    path(
        "analytics/progress/",
        AnalyticsProgressAPIView.as_view(),
        name="analytics-progress",
    ),
    # Graph AI chat endpoint
    path("graph/chat/", ChatbotAPIView.as_view(), name="graph-chat"),
]
