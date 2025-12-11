import ast
from pathlib import Path

from django.test import SimpleTestCase


class UrlsTest(SimpleTestCase):
    def test_urlpatterns_defined(self):
        urls_path = Path(__file__).resolve().parents[1] / "urls.py"
        assert urls_path.exists(), "backend/urls.py not found"

        source = urls_path.read_text(encoding="utf-8")
        tree = ast.parse(source, filename=str(urls_path))

        names = {n.id for n in ast.walk(tree) if isinstance(n, ast.Name)}
        assert "urlpatterns" in names

        has_list_literal = any(isinstance(n, ast.List) for n in ast.walk(tree))
        assert has_list_literal
