# -*- coding: utf-8 -*-
"""
Serializers for the artifacts (graph) API.
"""

from rest_framework import serializers


class NodeSerializer(serializers.Serializer):
    """Serializer for graph nodes."""

    id = serializers.CharField()
    type = serializers.CharField()
    r = serializers.IntegerField()
    color = serializers.CharField()
    label = serializers.CharField()
    title = serializers.CharField()


class LinkSerializer(serializers.Serializer):
    """Serializer for graph links."""

    source = serializers.CharField()
    target = serializers.CharField()


class GraphDataSerializer(serializers.Serializer):
    """Serializer for complete graph data."""

    nodes = NodeSerializer(many=True)
    links = LinkSerializer(many=True)
    metadata = serializers.DictField()
