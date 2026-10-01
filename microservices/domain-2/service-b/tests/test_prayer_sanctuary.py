import unittest
from unittest.mock import AsyncMock, Mock, patch

from app.agents.prayer_sanctuary import (
    _choose_verse,
    _has_unapproved_reference,
    _is_crisis,
    _themes_and_mood,
    create_prayer_reflection,
    delete_private_prayer,
    list_private_prayers,
)


class PrayerSanctuaryTests(unittest.IsolatedAsyncioTestCase):
    def test_scripture_selection_is_from_approved_corpus(self):
        verse = _choose_verse("peaceful")
        self.assertTrue(verse.reference)
        self.assertTrue(verse.text)

    def test_theme_extraction_maps_practical_concerns(self):
        themes, mood = _themes_and_mood("I am anxious about a decision at work")
        self.assertEqual(themes, ["anxiety", "guidance"])
        self.assertEqual(mood, "peaceful")

    def test_crisis_classifier_recognizes_direct_self_harm_language(self):
        self.assertTrue(_is_crisis("I want to die"))
        self.assertFalse(_is_crisis("I feel worried about tomorrow"))

    def test_generated_scripture_references_must_exist_in_the_approved_set(self):
        generated = {"meditation": "Remember Romans 8:28 as you reflect."}
        self.assertTrue(_has_unapproved_reference(generated, {"john 14:27"}))
        self.assertFalse(_has_unapproved_reference(generated, {"romans 8:28"}))

    async def test_crisis_response_skips_generation_and_scripture(self):
        with patch("app.agents.prayer_sanctuary.generate_content", new_callable=AsyncMock) as generate:
            result = await create_prayer_reflection("user_a", "I want to die", False)

        generate.assert_not_awaited()
        self.assertEqual(result["safetyStatus"], "crisis_escalation")
        self.assertIsNone(result["passage"])
        self.assertIn("988", result["supportMessage"])

    async def test_raw_prayer_is_not_sent_to_generation_and_saved_records_are_owned(self):
        prayer_text = "I feel anxious about my work and family responsibilities."
        saved_state = {"privatePrayers": []}
        database = Mock()
        database.read.side_effect = lambda: saved_state
        database.write.side_effect = lambda state: saved_state.update(state)
        generated = AsyncMock(return_value={
            "meditation": "Sit with the passage.",
            "reflectionQuestion": "What feels most important today?",
            "prayer": "Give me wisdom and peace.",
        })

        with patch("app.agents.prayer_sanctuary.get_db", return_value=database), patch(
            "app.agents.prayer_sanctuary.generate_content", new=generated
        ):
            result = await create_prayer_reflection("user_a", prayer_text, True)
            own_entries = list_private_prayers("user_a")
            other_entries = list_private_prayers("user_b")
            deleted_by_other_user = delete_private_prayer("user_b", result["id"])
            deleted_by_owner = delete_private_prayer("user_a", result["id"])

        self.assertEqual(generated.await_args.args[0], "peaceful")
        self.assertIsNone(generated.await_args.kwargs["note"])
        self.assertEqual(len(own_entries), 1)
        self.assertEqual(other_entries, [])
        self.assertFalse(deleted_by_other_user)
        self.assertTrue(deleted_by_owner)
        self.assertEqual(list_private_prayers("user_a"), [])


if __name__ == "__main__":
    unittest.main()