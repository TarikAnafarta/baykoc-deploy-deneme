# -*- coding: utf-8 -*-
"""Tests for the graph API views."""
from django.test import Client, SimpleTestCase
from django.urls import reverse


class GraphAPISmokeTest(SimpleTestCase):
    def setUp(self):
        self.client = Client()

    def test_graph_endpoints_exist(self):
        for name in [
            "artifacts:graph-data",
            "artifacts:graph-nodes",
            "artifacts:graph-links",
            "artifacts:graph-stats",
        ]:
            resp = self.client.get(reverse(name))
            # Accept 200 or 302/403 depending on auth, but endpoint must resolve
            self.assertIn(resp.status_code, {200, 302, 403, 401})
