export type Teaching = {
  slug: string;
  title: string;
  teacher: string;
  teacherRole: string;
  category: string;
  duration: string;
  scripture: string;
  excerpt: string;
  teaching: string;
  color: string;
  portrait: string;
  audioUrl?: string;
  videoUrl?: string;
};

export const teachings: Teaching[] = [
  { slug: "when-faith-feels-small", title: "When faith feels small", teacher: "Pastor Asket", teacherRole: "LifeBook teaching contributor", category: "Faith", duration: "12 min", scripture: "Mark 9:24", excerpt: "Lord, I believe; help my unbelief. Faith does not begin with pretending to be strong. It begins by bringing the truth into the presence of Jesus.", teaching: "Faith is not the absence of questions. It is the decision to bring our questions to Jesus. The father in Mark 9 did not hide his unbelief; he placed it honestly before the Lord. We can do the same. A small faith, offered to Christ, is still faith held by a great Savior.", color: "word-card-rose", portrait: "/AsketOfficialPic (1).png" },
  { slug: "learning-to-be-still", title: "Learning to be still", teacher: "Pastor Asket", teacherRole: "LifeBook teaching contributor", category: "Prayer", duration: "9 min", scripture: "Psalm 46:10", excerpt: "Be still, and know that I am God. Stillness is not an empty space. It is a way of remembering who God is when the noise has become too loud.", teaching: "Stillness is not something we master so we can impress God. It is a posture of receiving. We release our grip, remember that the Lord is God, and allow his presence to become more real to us than the urgency around us.", color: "word-card-sage", portrait: "/myself.jpeg" },
  { slug: "mercy-of-a-new-morning", title: "The mercy of a new morning", teacher: "Pastor Asket", teacherRole: "LifeBook teaching contributor", category: "Hope", duration: "15 min", scripture: "Lamentations 3:22–23", excerpt: "The steadfast love of the Lord never ceases; his mercies never come to an end. Every morning is an invitation to receive grace again.", teaching: "The mercy of God is not exhausted by yesterday. His compassion meets us again this morning, not because we have earned a fresh start, but because he is faithful. Receive today as a gift, and let gratitude become the beginning of hope.", color: "word-card-blue", portrait: "/AsketOfficialPic (1).png" },
  { slug: "a-life-shaped-by-love", title: "A life shaped by love", teacher: "Pastor Asket", teacherRole: "LifeBook teaching contributor", category: "Discipleship", duration: "18 min", scripture: "John 13:34–35", excerpt: "By this all people will know that you are my disciples, if you have love for one another. Following Jesus is learned in the way we love.", teaching: "Jesus does not describe discipleship only as what we know. He gives us a visible way to belong to him: love one another. This love is patient, costly, and practical. It becomes visible in the way we listen, forgive, serve, and remain present.", color: "word-card-gold", portrait: "/myself.jpeg" },
];
