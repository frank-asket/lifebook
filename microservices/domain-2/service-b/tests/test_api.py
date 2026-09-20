import unittest
import uuid
import time
from starlette.testclient import TestClient
from app.main import app

class TestFastAPIBackend(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.test_device_id = f"test_device_{uuid.uuid4()}"

    def test_root_and_health(self):
        r = self.client.get("/")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["service"], "lifebook-backend")
        self.assertIn("FastAPI", data["framework"])

        r_health = self.client.get("/api/health")
        self.assertEqual(r_health.status_code, 200)
        health_data = r_health.json()
        self.assertEqual(health_data["status"], "ok")
        self.assertEqual(health_data["service"], "lifebook-backend-fastapi")

    def test_checkin_and_streak(self):
        payload = {
            "deviceId": self.test_device_id,
            "mood": "peaceful",
            "note": "A restful morning with the Lord."
        }
        r = self.client.post("/api/checkin", json=payload)
        self.assertEqual(r.status_code, 200)
        res = r.json()
        self.assertIn("checkin", res)
        self.assertIn("content", res)
        self.assertIn("streak", res)
        self.assertTrue(len(res["content"]["verseReference"]) > 0)

        # Test streak retrieval
        r_streak = self.client.get(f"/api/streak?deviceId={self.test_device_id}")
        self.assertEqual(r_streak.status_code, 200)
        streak_data = r_streak.json()
        self.assertGreaterEqual(streak_data["current"], 1)

        # Test badges
        r_badges = self.client.get(f"/api/badges?deviceId={self.test_device_id}")
        self.assertEqual(r_badges.status_code, 200)
        self.assertIn("badges", r_badges.json())

    def test_community(self):
        # Groups
        r_groups = self.client.get("/api/groups")
        self.assertEqual(r_groups.status_code, 200)
        self.assertIn("groups", r_groups.json())

        # Prayer requests
        r_prayer = self.client.post("/api/prayer-requests", json={
            "deviceId": self.test_device_id,
            "text": "Please pray for safe travels and peace at work.",
            "category": "Work & Calling"
        })
        self.assertEqual(r_prayer.status_code, 200)

        r_prayers = self.client.get("/api/prayer-requests")
        self.assertEqual(r_prayers.status_code, 200)
        self.assertIn("requests", r_prayers.json())

        # Discussions
        r_disc = self.client.post("/api/discussions", json={
            "deviceId": self.test_device_id,
            "title": "Morning reflection on Proverbs",
            "body": "What verses give you strength when facing big decisions?",
            "tags": ["wisdom", "guidance"]
        })
        self.assertEqual(r_disc.status_code, 200)

        r_discs = self.client.get("/api/discussions")
        self.assertEqual(r_discs.status_code, 200)
        self.assertIn("discussions", r_discs.json())

    def test_journal_and_favorites(self):
        # Journal entry
        r_j = self.client.post("/api/journal", json={
            "deviceId": self.test_device_id,
            "text": "Reflecting on gratitude and peace today."
        })
        self.assertEqual(r_j.status_code, 200)

        r_list = self.client.get(f"/api/journal?deviceId={self.test_device_id}")
        self.assertEqual(r_list.status_code, 200)
        self.assertGreaterEqual(len(r_list.json()["entries"]), 1)

        # Favorite
        r_fav = self.client.post("/api/favorites", json={
            "deviceId": self.test_device_id,
            "contentId": "chk-test-1",
            "verseText": "Peace I leave with you...",
            "verseReference": "John 14:27"
        })
        self.assertEqual(r_fav.status_code, 200)

        r_favs = self.client.get(f"/api/favorites?deviceId={self.test_device_id}")
        self.assertEqual(r_favs.status_code, 200)
        self.assertGreaterEqual(len(r_favs.json()["favorites"]), 1)

    def test_journeys_lifecycle(self):
        r_journeys = self.client.get("/api/journeys")
        self.assertEqual(r_journeys.status_code, 200)
        journeys = r_journeys.json()["journeys"]
        self.assertGreater(len(journeys), 0)
        first_id = journeys[0]["id"]

        # Start journey
        r_start = self.client.post(f"/api/journeys/{first_id}/start", json={"deviceId": self.test_device_id})
        self.assertEqual(r_start.status_code, 200)

        # Check active journey
        r_act = self.client.get(f"/api/journeys-active?deviceId={self.test_device_id}")
        self.assertEqual(r_act.status_code, 200)
        self.assertIsNotNone(r_act.json()["active"])

        # Check recommended
        r_rec = self.client.get(f"/api/journeys-recommended?deviceId={self.test_device_id}")
        self.assertEqual(r_rec.status_code, 200)

        # Complete day
        r_comp = self.client.post(f"/api/journeys/{first_id}/complete-day", json={"deviceId": self.test_device_id})
        self.assertEqual(r_comp.status_code, 200)

        # Test Journey Grace Day activation (P3 Retention Protection)
        r_grace = self.client.post(f"/api/journeys/{first_id}/grace-day", json={
            "deviceId": self.test_device_id,
            "reason": "Family emergency & intentional Sabbath rest"
        })
        self.assertEqual(r_grace.status_code, 200)
        grace_data = r_grace.json()
        self.assertIn("graceEntry", grace_data)
        self.assertTrue(grace_data["progress"]["isGraceProtected"])

        # Test Grace catch-up restoration
        r_catchup = self.client.post(f"/api/journeys/{first_id}/grace-catchup", json={
            "deviceId": self.test_device_id
        })
        self.assertEqual(r_catchup.status_code, 200)
        self.assertEqual(r_catchup.json()["progress"]["status"], "active")

    def test_library_and_bookmarks(self):
        r_lib = self.client.get(f"/api/library?deviceId={self.test_device_id}")
        self.assertEqual(r_lib.status_code, 200)
        books = r_lib.json()["books"]
        self.assertGreater(len(books), 0)

        # Bookmark first book
        book_id = books[0]["id"]
        r_bm = self.client.post(f"/api/library/{book_id}/bookmark", json={"deviceId": self.test_device_id})
        self.assertEqual(r_bm.status_code, 200)
        self.assertTrue(r_bm.json()["entry"]["bookmarked"])

    def test_voice_and_livingword(self):
        r_v = self.client.post("/api/voice/answer", json={
            "deviceId": self.test_device_id,
            "question": "What does the Bible say about anxiety and peace?"
        })
        self.assertEqual(r_v.status_code, 200)
        self.assertIn("response", r_v.json())
        self.assertIn("references", r_v.json()["response"])

        r_lw = self.client.get("/api/livingword/teachings")
        self.assertEqual(r_lw.status_code, 200)
        teachings = r_lw.json()["teachings"]
        self.assertGreater(len(teachings), 0)

        # Comment on teaching
        first_slug = teachings[0]["slug"]
        r_com = self.client.post(f"/api/livingword/teachings/{first_slug}/comments", json={
            "deviceId": self.test_device_id,
            "text": "Such an encouraging message today. Thank you!"
        })
        self.assertEqual(r_com.status_code, 200)

    def test_preferences_and_push(self):
        # Preferences
        r_p = self.client.post("/api/preferences", json={
            "deviceId": self.test_device_id,
            "displayName": "Faithful Pilgrim",
            "spiritualPath": "Seeker"
        })
        self.assertEqual(r_p.status_code, 200)
        self.assertEqual(r_p.json()["preferences"]["displayName"], "Faithful Pilgrim")

        # Push token
        r_push = self.client.post("/api/push-token", json={
            "deviceId": self.test_device_id,
            "token": "ExponentPushToken[mock-test-token-12345]",
            "platform": "android"
        })
        self.assertEqual(r_push.status_code, 200)

        # Test notification dispatch
        r_test_notif = self.client.post("/api/notifications/send-test", json={
            "deviceId": self.test_device_id
        })
        self.assertEqual(r_test_notif.status_code, 200)

    def test_subscription(self):
        r_sub = self.client.get(f"/api/subscription?deviceId={self.test_device_id}")
        self.assertEqual(r_sub.status_code, 200)
        self.assertEqual(r_sub.json()["subscription"]["tier"], "free")

        r_up = self.client.post("/api/subscription/upgrade", json={
            "deviceId": self.test_device_id,
            "billingCycle": "annual"
        })
        self.assertEqual(r_up.status_code, 200)
        self.assertEqual(r_up.json()["subscription"]["tier"], "premium")

    def test_telemetry_and_analytics(self):
        # 1. Post single event
        r1 = self.client.post("/api/analytics/events", json={
            "deviceId": self.test_device_id,
            "eventName": "guided_flow_started",
            "properties": {"step": "scripture"}
        })
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r1.json()["event"]["eventName"], "guided_flow_started")

        # 2. Post batch events
        r2 = self.client.post("/api/analytics/events", json={
            "events": [
                {
                    "deviceId": self.test_device_id,
                    "eventName": "guided_step_viewed",
                    "properties": {"step": "scripture"}
                },
                {
                    "deviceId": self.test_device_id,
                    "eventName": "guided_step_completed",
                    "properties": {"step": "scripture", "dwellSeconds": 45}
                },
                {
                    "deviceId": self.test_device_id,
                    "eventName": "guided_flow_completed",
                    "properties": {"totalSeconds": 310, "habit5MinAchieved": True}
                },
                {
                    "deviceId": self.test_device_id,
                    "eventName": "habit_5min_achieved",
                    "properties": {"totalSeconds": 310}
                }
            ]
        })
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(r2.json()["recorded"], 4)

        # 3. Verify analytics summary & funnel
        r_sum = self.client.get("/api/analytics/summary")
        self.assertEqual(r_sum.status_code, 200)
        data = r_sum.json()
        self.assertGreaterEqual(data["totalEvents"], 5)
        self.assertGreaterEqual(data["guidedFlowStarts"], 1)
        self.assertGreaterEqual(data["guidedFlowCompletions"], 1)
        self.assertGreaterEqual(data["habit5MinAchieved"], 1)
        self.assertTrue(len(data["funnel"]) > 0)

        # 4. Verify recent events list
        r_list = self.client.get("/api/analytics/events?limit=10")
        self.assertEqual(r_list.status_code, 200)
        self.assertTrue(len(r_list.json()["events"]) > 0)

    def test_p4_waitlist_cohort_pipeline(self):
        # 1. Check cohorts summary
        r_cohorts = self.client.get("/api/waitlist/cohorts")
        self.assertEqual(r_cohorts.status_code, 200)
        cohorts_data = r_cohorts.json()
        self.assertIn("cohorts", cohorts_data)
        self.assertGreaterEqual(len(cohorts_data["cohorts"]), 4)
        self.assertIn("feedbackLoopRate", cohorts_data)

        # 2. Join waitlist
        unique_email = f"test.disciple.{int(time.time()*1000)}@lifebook.org"
        join_payload = {
            "email": unique_email,
            "name": "Jean-Marc disciple",
            "spiritualRole": "Pastor & Bible Teacher",
            "struggleFeedback": "Balancing sermon prep with intimate personal prayer time without feeling hurried.",
            "deviceId": self.test_device_id
        }
        r_join = self.client.post("/api/waitlist/join", json=join_payload)
        self.assertEqual(r_join.status_code, 200)
        join_res = r_join.json()
        member = join_res["member"]
        self.assertEqual(member["cohortId"], "cohort-beta")
        self.assertTrue(member["referralCode"].startswith("LB-"))
        self.assertEqual(member["stage"], "feedback_submitted")

        # 3. Submit deeper cohort feedback loop
        r_fb = self.client.post("/api/waitlist/feedback", json={
            "memberId": member["id"],
            "struggleFeedback": "Time fragmentation in the morning.",
            "desiredFeatures": ["Audio Sermons", "Pastoral Review", "Grace Days"],
            "dailyTimeAvailable": "5-10 min",
            "feedbackNote": "Excited for the pastoral review feature!"
        })
        self.assertEqual(r_fb.status_code, 200)

        # 4. Promote member through cohort pipeline
        r_prom = self.client.post("/api/waitlist/promote", json={
            "memberId": member["id"],
            "stage": "vip_invited",
            "note": "Fast-tracked for ministerial advisory board."
        })
        self.assertEqual(r_prom.status_code, 200)
        self.assertEqual(r_prom.json()["member"]["stage"], "vip_invited")

        # 5. List members by cohort
        r_members = self.client.get("/api/waitlist/members?cohortId=cohort-beta")
        self.assertEqual(r_members.status_code, 200)
        self.assertTrue(any(m["email"] == unique_email for m in r_members.json()["members"]))

    def test_p5_livingword_pastoral_review_cms(self):
        # 1. Create a draft pastoral teaching
        ts = int(time.time() * 1000)
        draft_payload = {
            "title": f"Abiding in the Vine during Storms {ts}",
            "teacher": "Pastor Asket",
            "teacherRole": "LifeBook pastoral teaching contributor",
            "category": "Discipleship",
            "duration": "14 min",
            "scripture": "John 15:5-7",
            "excerpt": "Apart from Me you can do nothing.",
            "fullBody": "Christ calls us to branch-like reliance, not anxious striving.",
            "theologicalNotes": "Greek word 'meno' implies permanent dwelling, not occasional visits.",
            "status": "under_pastoral_review",
            "theologicalRubric": {
                "scriptureAccuracy": 5,
                "christocentricFocus": 5,
                "pastoralTone": 5,
                "historicalOrthodoxy": 5,
                "notes": "Faithful exposition of Johannine vine theology."
            }
        }
        r_create = self.client.post("/api/livingword/cms/create", json=draft_payload)
        self.assertEqual(r_create.status_code, 200)
        created = r_create.json()["teaching"]
        slug = created["slug"]
        self.assertEqual(created["status"], "under_pastoral_review")

        # 2. View CMS teaching queue
        r_cms_list = self.client.get("/api/livingword/cms/teachings?status=under_pastoral_review")
        self.assertEqual(r_cms_list.status_code, 200)
        self.assertTrue(any(t["slug"] == slug for t in r_cms_list.json()["teachings"]))

        # 3. Perform Pastoral Review and publish
        r_review = self.client.post(f"/api/livingword/cms/{slug}/review", json={
            "reviewerId": "Pastor Asket",
            "verdict": "published",
            "rubric": {
                "scriptureAccuracy": 5,
                "christocentricFocus": 5,
                "pastoralTone": 5,
                "historicalOrthodoxy": 5
            },
            "pastoralNotes": "Theologically vetted and approved for congregation publication."
        })
        self.assertEqual(r_review.status_code, 200)
        self.assertEqual(r_review.json()["status"], "published")

        # 4. Verify teaching is now accessible in public list
        r_pub = self.client.get("/api/livingword/teachings")
        self.assertEqual(r_pub.status_code, 200)
        self.assertTrue(any(t["slug"] == slug for t in r_pub.json()["teachings"]))

if __name__ == "__main__":
    unittest.main()
