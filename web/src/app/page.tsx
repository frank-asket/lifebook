"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import LivingWord from "./LivingWord";
import VoicePractice from "./VoicePractice";

const benefits = [
  { title: "Bring your whole heart", text: "Come as you are: grateful, peaceful, seeking, doubting, distant, or convicted. God is not surprised by any of it.", tone: "benefit-lilac", icon: "♡" },
  { title: "Let Scripture speak", text: "Receive a passage from the Bible, then make room to reflect, be still, and respond to God in prayer.", tone: "benefit-blue", icon: "✦" },
  { title: "Walk it out", text: "Build a faithful rhythm through guided journeys, journaling, prayer requests, and small steps of obedience.", tone: "benefit-mint", icon: "†" },
];

const steps = [
  ["Come honestly", "Name the season you are in. There is no need to dress up your prayer before God."],
  ["Sit with the Word", "Receive Scripture, reflect on what it reveals, and be quiet long enough to listen."],
  ["Walk with Jesus", "Pray, write what you are learning, and carry one faithful step into the rest of your day."],
];

const faqs = [
  ["What is LifeBook?", "LifeBook is a Christian devotional companion for meeting with God through Scripture, reflection, meditation, prayer, and Christian community."],
  ["Do I have to know exactly how I feel?", "No. The Psalms give us words for joy, grief, doubt, longing, and hope. LifeBook gives you a gentle place to begin with the truth."],
  ["Can I move at my own pace?", "Yes. Take a few minutes with a verse, or follow a five-day journey when you are ready to go deeper. There is no spiritual scoreboard."],
  ["Is LifeBook a replacement for church or pastoral care?", "No. LifeBook is a companion for personal practice, not a replacement for your church, pastor, trusted people, or professional care."],
];

function ArrowIcon() { return <span aria-hidden="true">↗</span>; }
function Mark() { return <span className="brand-logo" aria-hidden="true"><Image src="/logol.png" alt="" fill unoptimized /></span>; }

export default function Home() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim()) {
      setJoined(true);
      router.push("/thank-you");
    }
  }

  return (
    <main className="showcase-page">
      <section className="showcase-hero" id="top">
        <nav className="showcase-nav page-shell" aria-label="Main navigation">
          <a className="wordmark" href="#top" aria-label="LifeBook home"><Mark /><span>LifeBook</span></a>
          <div className="showcase-links"><a href="#features">Bible & prayer</a><Link href="/voice">LifeBook Voice</Link><Link href="/living-word">LivingWord</Link><a href="#questions">Questions</a></div>
          <div className="auth-actions">
            <Show when="signed-out">
              <SignInButton mode="modal"><button className="nav-sign-in" type="button">Sign in</button></SignInButton>
              <SignUpButton mode="modal"><button className="pill-button pill-dark" type="button">Begin your journey</button></SignUpButton>
            </Show>
            <Show when="signed-in"><UserButton appearance={{ elements: { avatarBox: "lifebook-user-avatar" } }} /></Show>
          </div>
          <button className={`mobile-menu-button ${menuOpen ? "menu-open" : ""}`} type="button" aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}><span /><span /><span /><b>{menuOpen ? "Close" : "Menu"}</b></button>
        </nav>
        {menuOpen && <div className="mobile-navigation page-shell" id="mobile-navigation"><a href="#features" onClick={() => setMenuOpen(false)}>Bible & prayer</a><Link href="/voice" onClick={() => setMenuOpen(false)}>LifeBook Voice</Link><Link href="/living-word" onClick={() => setMenuOpen(false)}>LivingWord</Link><a href="#questions" onClick={() => setMenuOpen(false)}>Questions</a><Show when="signed-out"><SignUpButton mode="modal"><button className="mobile-join" type="button" onClick={() => setMenuOpen(false)}>Begin your journey ↗</button></SignUpButton></Show><Show when="signed-in"><div className="mobile-account"><UserButton /></div></Show></div>}
        <div className="showcase-hero-grid page-shell">
          <div className="showcase-hero-copy"><p className="showcase-eyebrow">A daily place to walk with Jesus</p><h1>Make room for <em>God</em> in the middle of real life.</h1><p>LifeBook helps you slow down with Scripture, tell the truth in prayer, and take the next faithful step, whether today feels full of peace or full of questions.</p><div className="showcase-actions"><a className="pill-button pill-dark" href="#join">Begin your journey <ArrowIcon /></a><span className="rating-note"><b>✦</b> “Abide in me.”<br /><small>John 15:4 · A quiet place to remain in Christ.</small></span></div></div>
          <div className="preview-stage" aria-label="LifeBook app preview"><div className="preview-glow" /><div className="preview-card preview-card-back"><span>Continue your journey</span><strong>Growing in Faith</strong><small>Day 3 of 5</small><div className="progress-track"><i /></div></div><div className="preview-phone"><div className="preview-status"><span>9:41</span><span>•••</span></div><div className="preview-heading"><small>Good morning, Maya</small><strong>How is your soul today?</strong></div><div className="preview-moods"><span className="mood-peace">◌<b>Peaceful</b><small>Resting in God’s presence</small></span><span className="mood-seek">⌕<b>Seeking</b><small>Searching for direction</small></span><span className="mood-grateful">✦<b>Grateful</b><small>Thankful for God’s care</small></span><span className="mood-doubt">?<b>Doubting</b><small>Wrestling with questions</small></span></div><div className="preview-tabbar"><span>Home</span><span>Library</span><b>Practice</b><span>Community</span></div></div><div className="preview-card preview-card-front"><b>Today’s Scripture</b><p>“The Lord is my shepherd.”</p><small>Psalm 23:1</small></div></div>
        </div>
        <div className="hero-scroll page-shell"><span>Explore the practice</span><i /></div>
      </section>

      <section className="benefits-section page-shell" id="features"><div className="section-heading"><div><p className="showcase-eyebrow">A companion for the life of faith</p><h2>Come to God<br /><em>just as you are.</em></h2></div><p>LifeBook is not here to measure your faith. It is a quiet place to return to God, receive his Word, and practice faithfulness in ordinary life.</p></div><div className="benefit-grid">{benefits.map((benefit) => <article className={`benefit-card ${benefit.tone}`} key={benefit.title}><span className="benefit-icon">{benefit.icon}</span><h3>{benefit.title}</h3><p>{benefit.text}</p><span className="benefit-arrow">↗</span></article>)}</div></section>

      <section className="how-section" id="how-it-works"><div className="page-shell"><div className="how-heading"><p className="showcase-eyebrow">A simple rhythm of abiding</p><h2>How it <em>works.</em></h2><p>Five gentle movements: receive the Word, reflect honestly, be still before God, pray, and carry his presence with you.</p></div><div className="how-grid"><div className="step-list">{steps.map(([title, text], index) => <div className={`how-step ${index === 0 ? "selected-step" : ""}`} key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div><b>↗</b></div>)}</div><div className="scripture-preview"><div className="scripture-top"><span>Today with God</span><span>Step 01 / 05</span></div><div className="scripture-art"><span>“</span><p>He restores<br />my soul.</p><small>Psalm 23:3</small></div><div className="scripture-bottom"><span>Scripture</span><span>Reflect</span><span>Meditate</span><span>Pray</span></div></div></div></div></section>

      <section className="journeys-section page-shell"><div className="journey-panel"><div className="journey-panel-art"><span className="journey-orbit" /><span className="journey-sun">✦</span><b>05</b><small>days of<br />walking with God</small></div><div className="journey-panel-copy"><p className="showcase-eyebrow">Keep seeking the Lord</p><h2>Faith grows<br /><em>one day at a time.</em></h2><p>Choose a five-day journey when you want to go deeper. Find peace in God’s presence, grow in faith, or bring your fears honestly before him through Scripture, prayer, and reflection.</p><a className="underlined-link" href="#join">Explore journeys <ArrowIcon /></a></div></div></section>

      <VoicePractice />

      <LivingWord />

      <section className="community-proof-section page-shell"><div><p className="showcase-eyebrow">Built with people, not assumptions</p><h2>The first reviews<br /><em>will be honest.</em></h2></div><div className="proof-copy"><p>LifeBook is still gathering its first real user stories. We will publish customer reflections only after people have used the product and given permission to share their experience.</p><div className="proof-note"><span>✦</span><strong>Real voices soon</strong><small>We are recruiting the first 5–10 pilot users now.</small></div><Link className="underlined-link" href="#join">Join the pilot circle <ArrowIcon /></Link></div></section>

      <section className="team-section page-shell"><div className="team-heading"><p className="showcase-eyebrow">The people behind the practice</p><h2>Faith is<br /><em>shared.</em></h2><p>LifeBook is being shaped by Christian teaching, product care, and the wisdom of people who know that faith includes both confidence and questions.</p></div><div className="team-portraits"><div><Image src="/AsketOfficialPic (1).png" alt="LifeBook teaching contributor" width={180} height={220} /><span>Teaching contributor</span></div><div><Image src="/myself.jpeg" alt="LifeBook project contributor" width={180} height={220} /><span>LifeBook contributor</span></div></div></section>

      <section className="questions-section page-shell" id="questions"><div className="questions-heading"><p className="showcase-eyebrow">Questions for the journey</p><h2>Can this help<br /><em>my faith?</em></h2><span className="question-mark">?</span></div><div className="faq-list">{faqs.map(([question, answer], index) => <div className={`faq-row ${openFaq === index ? "faq-open" : ""}`} key={question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}><span>{question}</span><b>{openFaq === index ? "−" : "+"}</b></button>{openFaq === index && <p>{answer}</p>}</div>)}</div></section>

      <section className="closing-section" id="join"><div className="closing-band page-shell"><div><p className="showcase-eyebrow">Come and see</p><h2>Make room for<br /><em>the presence of God.</em></h2></div><div className="closing-form"><p>Join the early circle and help shape a place where Christians can return to Scripture, prayer, and the faithful presence of one another.</p>{joined ? <div className="success-message">You’re on the list. We’ll be in touch soon. <span>✦</span></div> : <form onSubmit={handleSubmit}><label htmlFor="email">Your email address</label><div><input id="email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /><button type="submit" aria-label="Join the LifeBook waitlist"><ArrowIcon /></button></div></form>}<small>No noise. Just a note when LifeBook is ready for you.</small></div></div></section>
      <footer className="site-footer">
        <div className="page-shell">
          <div className="footer-lead"><a className="footer-logo" href="#top" aria-label="LifeBook home"><Image src="/logol.png" alt="LifeBook" width={78} height={78} unoptimized /></a><p>“Draw near to God, and he will draw near to you.”<small>James 4:8</small></p></div>
          <div className="footer-nav">
            <div className="footer-column"><h3>Practice</h3><a href="#features">Bible & prayer</a><a href="#how-it-works">Guided practice</a><a href="#how-it-works">Meditation</a><a href="#features">Journaling</a><Link href="/voice">LifeBook Voice</Link></div>
            <div className="footer-column"><h3>Grow</h3><a href="#features">Faith journeys</a><a href="#questions">Daily check-in</a><a href="#questions">Progress</a><Link href="/living-word">LivingWord teachings</Link><a href="#join">Join the early circle</a></div>
            <div className="footer-column"><h3>Community</h3><a href="#questions">Prayer requests</a><a href="#questions">Groups</a><a href="#questions">Pastoral care</a><a href="#questions">Questions</a><a href="#living-word">Teaching conversations</a></div>
            <div className="footer-column"><h3>Follow along</h3><a href="#top">Instagram ↗</a><a href="#top">YouTube ↗</a><a href="#top">Email us ↗</a><span className="footer-note">A quieter way to walk<br />with Jesus, together.</span></div>
          </div>
          <div className="footer-bottom"><span>© 2026 LifeBook</span><span>Made for the journey of faith</span><div><Link href="/privacy">Privacy</Link><a href="#top">Terms</a><a href="#top">Accessibility</a></div></div>
        </div>
      </footer>
      <Link className="sticky-mobile-cta" href="#join">Begin your journey <ArrowIcon /></Link>
    </main>
  );
}
