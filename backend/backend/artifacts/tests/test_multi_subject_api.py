# -*- coding: utf-8 -*-
"""Tests for multi-subject curriculum graph API behavior."""


from django.conf import settings
from django.test import TestCase
from django.urls import reverse


class MultiSubjectGraphAPITest(TestCase):
    def setUp(self):
        # Create a simple dummy curriculum file for a fake subject
        base_dir = settings.CURRICULUM_DIR
        base_dir.mkdir(parents=True, exist_ok=True)
        subject_dir = base_dir / "testsubject"
        subject_dir.mkdir(parents=True, exist_ok=True)
        self.data_file = subject_dir / "dummy.json"
        self.data_file.write_text(
            """[
            {"id": "n1", "type": "konu", "label": "Test Konu"},
            {"id": "n2", "type": "kazanım", "parent_id": "n1", "sinif": 9}
            ]""",
            encoding="utf-8",
        )

    def tearDown(self):
        if self.data_file.exists():
            self.data_file.unlink()
        self.data_file.parent.rmdir()

    def test_graph_data_for_specific_subject(self):
        url = reverse("artifacts:graph-data")
        resp = self.client.get(url, {"subject": "testsubject"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()["data"]
        self.assertEqual(data["subject"], "testsubject")
        self.assertEqual(data["file"], "dummy.json")
        self.assertEqual(len(data["nodes"]), 2)
        self.assertEqual(len(data["links"]), 1)

    def test_grade_filter_keeps_parent_context(self):
        url = reverse("artifacts:graph-data")
        resp = self.client.get(url, {"subject": "testsubject", "grade": "9"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()["data"]
        node_ids = {node["id"] for node in data["nodes"]}
        self.assertIn("n1", node_ids)
        self.assertIn("n2", node_ids)

    def test_graph_nodes_accepts_filename(self):
        url = reverse("artifacts:graph-nodes")
        resp = self.client.get(
            url,
            {
                "subject": "testsubject",
                "file": self.data_file.name,
            },
        )
        self.assertEqual(resp.status_code, 200)
        nodes = resp.json()
        self.assertEqual(len(nodes), 2)
