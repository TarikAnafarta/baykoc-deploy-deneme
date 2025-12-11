import importlib
import json

from django.test import SimpleTestCase


class SettingsSmokeTest(SimpleTestCase):
    def test_settings_module_imports(self):
        mod = importlib.import_module("backend.settings")
        # Basic attributes should exist on the module
        assert hasattr(mod, "DEBUG")
        assert hasattr(mod, "INSTALLED_APPS")
        assert hasattr(mod, "ROOT_URLCONF")

    def test_serialization_roundtrip(self):
        data = {"ok": True}
        assert json.loads(json.dumps(data)) == data
