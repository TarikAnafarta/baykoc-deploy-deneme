from django.test import SimpleTestCase


class SmokeTest(SimpleTestCase):
    def test_math(self):
        self.assertEqual(2 + 2, 4)
