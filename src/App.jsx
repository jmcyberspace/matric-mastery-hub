import { useState, useEffect, useRef } from "react";

// ─── DATA ───

const SUBJECTS = [
  { id: "maths", name: "Mathematics", icon: "∑", color: "#E8553A", progress: 62, grade: "C", topics: 14, mastered: 8 },
  { id: "physics", name: "Physical Sciences", icon: "⚛", color: "#3A8FE8", progress: 45, grade: "D", topics: 12, mastered: 5 },
  { id: "life-sci", name: "Life Sciences", icon: "🧬", color: "#2EAD6B", progress: 78, grade: "B", topics: 10, mastered: 7 },
  { id: "english", name: "English FAL", icon: "Aa", color: "#9B5DE5", progress: 71, grade: "B", topics: 8, mastered: 6 },
];

const LANGUAGES = ["English", "Afrikaans", "Setswana"];

const PAST_PAPERS = [
  { year: 2025, subject: "Mathematics", paper: "Paper 1", score: null, status: "new" },
  { year: 2025, subject: "Mathematics", paper: "Paper 2", score: null, status: "new" },
  { year: 2024, subject: "Mathematics", paper: "Paper 1", score: 58, status: "marked" },
  { year: 2024, subject: "Physical Sciences", paper: "Paper 1", score: 42, status: "marked" },
  { year: 2024, subject: "Life Sciences", paper: "Paper 1", score: 67, status: "marked" },
];

const SYSTEM_PROMPTS = {
  maths: `You are a warm, encouraging Mathematics tutor for South African matric (Grade 12) students following the CAPS curriculum. Your name is Mastery AI.

Key behaviors:
- Explain concepts step-by-step with clear worked examples
- Use South African matric past paper questions when relevant
- Adapt to the student's level — if they're struggling, simplify; if they're doing well, challenge them
- Be encouraging but honest about mistakes
- Use mathematical notation where helpful (you can use Unicode symbols like ², ³, √, π, ≠, ≤, ≥, →)
- Cover topics: Algebra, Functions & Graphs, Calculus (differentiation), Financial Maths, Probability, Trigonometry, Euclidean Geometry, Analytical Geometry, Number Patterns, Statistics
- Reference NSC exam structure (Paper 1: Algebra, Calculus, Finance, Probability; Paper 2: Geometry, Trig, Stats)
- Keep responses concise but thorough — this is a mobile chat interface
- Occasionally use South African expressions to feel relatable

The student is Keitumetse, Grade 12, currently scoring 62% in maths. Weakest area: Calculus (specifically differentiation and the chain rule). She has a 12-day study streak and is aiming for a bachelor pass.`,

  physics: `You are a warm, encouraging Physical Sciences tutor for South African matric (Grade 12) students following the CAPS curriculum. Your name is Mastery AI.

Key behaviors:
- Explain physics and chemistry concepts with real-world examples
- Use proper SI units and formulae
- Break complex problems into clear steps
- Reference the CAPS formula sheet where relevant
- Cover topics: Mechanics (Newton's Laws, momentum, work-energy-power), Waves/Sound/Light, Electricity & Magnetism, Matter & Materials, Chemical Change, Chemical Systems
- Keep responses concise for mobile chat
- Be encouraging and patient

The student is Keitumetse, Grade 12, currently scoring 45% in Physical Sciences. Weakest area: Newton's Laws. She needs focused help to improve.`,

  "life-sci": `You are a warm, encouraging Life Sciences tutor for South African matric (Grade 12) students following the CAPS curriculum. Your name is Mastery AI.

Key behaviors:
- Explain biological concepts clearly with diagrams described in text
- Help with terminology and definitions (important for Life Sciences exams)
- Cover topics: DNA/RNA/Protein synthesis, Meiosis, Genetics, Evolution, Human Nervous System, Endocrine System, Human Reproduction, Human Impact on Environment
- Help students with essay-type questions and data-response questions
- Keep responses concise for mobile chat

The student is Keitumetse, Grade 12, currently scoring 78% in Life Sciences. Doing well — push for distinction (80%+).`,

  english: `You are a warm, encouraging English First Additional Language (FAL) tutor for South African matric (Grade 12) students following the CAPS curriculum. Your name is Mastery AI.

Key behaviors:
- Help with comprehension, summary writing, language structures, essay writing, literature analysis
- Give constructive feedback on writing
- Explain grammar concepts with examples
- Help prepare for Paper 1 (Language), Paper 2 (Literature), Paper 3 (Writing)
- Keep responses concise for mobile chat

The student is Keitumetse, Grade 12, currently scoring 71% in English FAL. Doing well — focus on essay structure and literature analysis for improvement.`,
};

const INITIAL_MESSAGES = {
  maths: [{ role: "assistant", content: "Molo, Keitumetse! 👋 I'm your Maths tutor. I can see you're working on Calculus — specifically differentiation. Would you like me to explain the chain rule, or shall we practice with past-paper questions? I'm here to help you push that 62% up!" }],
  physics: [{ role: "assistant", content: "Hello, Keitumetse! Let's tackle Physical Sciences together. Your diagnostic shows Newton's Laws need attention. Want to start with a quick concept check, or jump into a problem?" }],
  "life-sci": [{ role: "assistant", content: "Hi Keitumetse! 🧬 Great work on Life Sciences — 78% is solid! Let's push for that distinction. What would you like to work on? DNA & protein synthesis, genetics, evolution, or something else?" }],
  english: [{ role: "assistant", content: "Hello Keitumetse! 📚 Your English is looking good at 71%. Let's sharpen those skills — I can help with essay writing, comprehension strategies, literature analysis, or grammar. What do you need today?" }],
};

const WEEKLY_DATA = [
  { day: "Mon", minutes: 45 }, { day: "Tue", minutes: 30 }, { day: "Wed", minutes: 60 },
  { day: "Thu", minutes: 20 }, { day: "Fri", minutes: 55 }, { day: "Sat", minutes: 90 }, { day: "Sun", minutes: 40 },
];

const STUDENTS = [
  { id: 1, name: "Keitumetse D.", school: "Upington High", grade: 12, avatar: "K", maths: 62, physics: 45, lifeSci: 78, english: 71, avgScore: 64, trend: "improving", lastActive: "today", studyMin: 340, streak: 12, risk: "low", bachelorProb: 68, papers: 5, weakTopic: "Calculus" },
  { id: 2, name: "Thabo M.", school: "Rietfontein Combined", grade: 12, avatar: "T", maths: 31, physics: 38, lifeSci: 52, english: 44, avgScore: 41, trend: "declining", lastActive: "3 days ago", studyMin: 85, streak: 0, risk: "high", bachelorProb: 18, papers: 1, weakTopic: "Algebra" },
  { id: 3, name: "Lerato K.", school: "Pofadder High", grade: 11, avatar: "L", maths: 55, physics: 34, lifeSci: 61, english: 58, avgScore: 52, trend: "stagnant", lastActive: "1 day ago", studyMin: 160, streak: 3, risk: "medium", bachelorProb: 42, papers: 3, weakTopic: "Newton's Laws" },
  { id: 4, name: "Pieter vdM.", school: "Kakamas High", grade: 12, avatar: "P", maths: 28, physics: 25, lifeSci: 40, english: 35, avgScore: 32, trend: "declining", lastActive: "5 days ago", studyMin: 30, streak: 0, risk: "high", bachelorProb: 8, papers: 0, weakTopic: "Trigonometry" },
  { id: 5, name: "Naledi S.", school: "Springbok Combined", grade: 11, avatar: "N", maths: 72, physics: 68, lifeSci: 81, english: 75, avgScore: 74, trend: "improving", lastActive: "today", studyMin: 420, streak: 21, risk: "low", bachelorProb: 88, papers: 8, weakTopic: "Organic Chemistry" },
  { id: 6, name: "Johannes F.", school: "Upington High", grade: 12, avatar: "J", maths: 48, physics: 52, lifeSci: 60, english: 55, avgScore: 54, trend: "improving", lastActive: "today", studyMin: 210, streak: 7, risk: "medium", bachelorProb: 45, papers: 4, weakTopic: "Electrostatics" },
  { id: 7, name: "Amogelang R.", school: "Rietfontein Combined", grade: 12, avatar: "A", maths: 40, physics: 36, lifeSci: 55, english: 50, avgScore: 45, trend: "stagnant", lastActive: "2 days ago", studyMin: 100, streak: 1, risk: "medium", bachelorProb: 28, papers: 2, weakTopic: "Functions & Graphs" },
  { id: 8, name: "Maria vW.", school: "Kakamas High", grade: 11, avatar: "M", maths: 85, physics: 78, lifeSci: 90, english: 82, avgScore: 84, trend: "improving", lastActive: "today", studyMin: 510, streak: 30, risk: "low", bachelorProb: 96, papers: 12, weakTopic: "Probability" },
  { id: 9, name: "Sipho N.", school: "Pofadder High", grade: 12, avatar: "S", maths: 35, physics: 30, lifeSci: 48, english: 42, avgScore: 39, trend: "declining", lastActive: "4 days ago", studyMin: 55, streak: 0, risk: "high", bachelorProb: 12, papers: 1, weakTopic: "Differentiation" },
  { id: 10, name: "Refilwe T.", school: "Springbok Combined", grade: 11, avatar: "R", maths: 60, physics: 57, lifeSci: 70, english: 65, avgScore: 63, trend: "improving", lastActive: "today", studyMin: 290, streak: 9, risk: "low", bachelorProb: 62, papers: 6, weakTopic: "Work, Energy, Power" },
];

const SCHOOLS = ["All Schools", "Upington High", "Rietfontein Combined", "Pofadder High", "Kakamas High", "Springbok Combined"];

const MONTHLY_TRENDS = [
  { month: "Jan", avg: 38 }, { month: "Feb", avg: 41 }, { month: "Mar", avg: 44 },
  { month: "Apr", avg: 48 }, { month: "May", avg: 46 }, { month: "Jun", avg: 50 },
  { month: "Jul", avg: 53 }, { month: "Aug", avg: 55 }, { month: "Sep", avg: 54 }, { month: "Oct", avg: 57 },
];

// ─── SHARED COMPONENTS ───

function CircularProgress({ value, size = 80, stroke = 6, color, children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

function MiniBar({ data, color, height = 60 }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ width: 18, borderRadius: 4, height: Math.max(4, (d.value / max) * height * 0.85), background: color || "#E8553A", opacity: 0.7 + (d.value / max) * 0.3, transition: "height 0.5s ease" }} />
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function RiskBadge({ risk }) {
  const c = risk === "high" ? "#E8553A" : risk === "medium" ? "#FFB930" : "#2EAD6B";
  return <span style={{ padding: "3px 10px", borderRadius: 10, fontSize: 10, fontWeight: 600, textTransform: "uppercase", background: c + "18", color: c }}>{risk}</span>;
}

function TrendArrow({ trend }) {
  const c = trend === "declining" ? "#E8553A" : trend === "improving" ? "#2EAD6B" : "#FFB930";
  return <span style={{ fontSize: 15, color: c }}>{trend === "declining" ? "↓" : trend === "improving" ? "↑" : "→"}</span>;
}

function ScoreBar({ value, color }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", width: "100%" }}>
      <div style={{ height: "100%", borderRadius: 3, background: color || "#E8553A", width: (value) + "%", transition: "width 0.8s ease", minWidth: 2 }} />
    </div>
  );
}

function AreaChart({ data, color, height = 100 }) {
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value)) * 0.8;
  const w = 100, h = height;
  const points = data.map((d, i) => ({ x: (i / (data.length - 1)) * w, y: h - ((d.value - min) / (max - min)) * (h * 0.8) - h * 0.1 }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = linePath + ` L${w},${h} L0,${h} Z`;
  const gid = `grad-${color.replace("#","")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={areaPath} fill={`url(#${gid})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} />)}
    </svg>
  );
}

// ─── LIVE AI BADGE ───

function LiveAIBadge() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 12, background: "rgba(46,173,107,0.12)", border: "1px solid rgba(46,173,107,0.25)" }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2EAD6B", animation: "pulse 2s ease infinite" }} />
      <span style={{ fontSize: 9, fontWeight: 600, color: "#2EAD6B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Live AI</span>
    </div>
  );
}

// ─── LEARNER: HOME ───

function HomeScreen({ onNavigate, learnerName }) {
  const [lang, setLang] = useState(0);
  const totalMinutes = WEEKLY_DATA.reduce((a, d) => a + d.minutes, 0);
  return (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 16 }}>
        <div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>Good afternoon,</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 0", color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{learnerName}</h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setLang((lang + 1) % 3)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "6px 12px", color: "#fff", fontSize: 11, cursor: "pointer" }}>🌍 {LANGUAGES[lang]}</button>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #E8553A, #FF8C42)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{learnerName[0]}</div>
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg, rgba(232,85,58,0.15), rgba(255,140,66,0.1))", border: "1px solid rgba(232,85,58,0.25)", borderRadius: 16, padding: 16, marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 28 }}>🔥</span>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#E8553A", fontFamily: "'Outfit', sans-serif" }}>12 Day Streak</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>Keep it up!</p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{totalMinutes}<span style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.4)" }}> min</span></p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>this week</p>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)", margin: "0 0 12px", fontFamily: "'Outfit', sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>Weekly Activity</h3>
        <MiniBar data={WEEKLY_DATA.map(d => ({ value: d.minutes, label: d.day }))} height={50} color="#E8553A" />
      </div>

      <div style={{ marginTop: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)", margin: "0 0 14px", fontFamily: "'Outfit', sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>My Subjects</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {SUBJECTS.map(sub => (
            <button key={sub.id} onClick={() => onNavigate("tutor", sub.id)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16, cursor: "pointer", textAlign: "left", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: sub.color, opacity: 0.06 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 28 }}>{sub.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: sub.color, background: sub.color + "18", padding: "2px 8px", borderRadius: 8 }}>{sub.grade}</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "10px 0 2px" }}>{sub.name}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>{sub.mastered}/{sub.topics} topics</p>
              <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
                <div style={{ height: "100%", borderRadius: 2, background: sub.color, width: sub.progress + "%" }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
        {[{ label: "Past Papers", icon: "📝", action: () => onNavigate("papers") }, { label: "AI Tutor", icon: "🤖", action: () => onNavigate("tutor", "maths") }, { label: "My Progress", icon: "📊", action: () => onNavigate("progress") }].map((a, i) => (
          <button key={i} onClick={a.action} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 8px", cursor: "pointer", textAlign: "center" }}>
            <span style={{ fontSize: 22, display: "block" }}>{a.icon}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 6, display: "block" }}>{a.label}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, background: "rgba(46,173,107,0.08)", border: "1px solid rgba(46,173,107,0.2)" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2EAD6B" }} />
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Live AI demo — powered by Claude</span>
      </div>
    </div>
  );
}

// ─── LEARNER: AI TUTOR (LIVE AI) ───

function TutorScreen({ subjectId, onBack }) {
  const subject = SUBJECTS.find(s => s.id === subjectId) || SUBJECTS[0];
  const [messages, setMessages] = useState(INITIAL_MESSAGES[subjectId] || INITIAL_MESSAGES.maths);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamedText, setStreamedText] = useState("");
  const chatRef = useRef(null);
  const abortRef = useRef(null);

  const quickPrompts = {
    maths: ["Explain chain rule", "Practice question", "Help with functions"],
    physics: ["Newton's Laws", "Practice question", "Explain momentum"],
    "life-sci": ["DNA replication", "Practice question", "Explain meiosis"],
    english: ["Essay structure", "Practice question", "Grammar help"],
  };

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMessage = { role: "user", content: msg };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError(null);
    setStreamedText("");

    // Build conversation history for the API (skip initial assistant greeting for cleaner context)
    const apiMessages = updatedMessages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      abortRef.current = new AbortController();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          system: SYSTEM_PROMPTS[subjectId] || SYSTEM_PROMPTS.maths,
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantText = data.content
        .filter(block => block.type === "text")
        .map(block => block.text)
        .join("\n");

      setMessages(prev => [...prev, { role: "assistant", content: assistantText }]);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("AI Tutor error:", err);
      setError("Connection issue — please try again.");
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm having a connection issue right now. Please try sending your message again — I'm here to help! 💪"
      }]);
    } finally {
      setLoading(false);
      setStreamedText("");
    }
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading, streamedText]);

  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: subject.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{subject.icon}</div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>{subject.name} Tutor</p>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>CAPS-aligned · Adaptive</p>
        </div>
        <LiveAIBadge />
      </div>
      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
            <div style={{ padding: "12px 16px", borderRadius: 16, background: msg.role === "user" ? subject.color : "rgba(255,255,255,0.06)", borderBottomRightRadius: msg.role === "user" ? 4 : 16, borderBottomLeftRadius: msg.role === "user" ? 16 : 4 }}>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: msg.role === "user" ? "#fff" : "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap" }}>{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", maxWidth: "85%" }}>
            <div style={{ padding: "12px 16px", borderRadius: 16, background: "rgba(255,255,255,0.06)", borderBottomLeftRadius: 4 }}>
              {streamedText ? (
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap" }}>{streamedText}<span style={{ display: "inline-block", width: 6, height: 14, background: subject.color, marginLeft: 2, animation: "blink 1s step-end infinite", verticalAlign: "text-bottom" }} /></p>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: subject.color, opacity: 0.6, animation: `bounce 1.2s ease ${i*0.15}s infinite` }} />)}
                  </div>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Thinking...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: "12px 20px 28px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Ask me anything..."
            disabled={loading}
            style={{ flex: 1, padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, outline: "none", opacity: loading ? 0.5 : 1 }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading}
            style={{ width: 44, height: 44, borderRadius: 12, border: "none", background: loading ? "rgba(255,255,255,0.1)" : subject.color, color: "#fff", fontSize: 18, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
          >↑</button>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {(quickPrompts[subjectId] || quickPrompts.maths).map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s)}
              disabled={loading}
              style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: loading ? "default" : "pointer", opacity: loading ? 0.4 : 1 }}
            >{s}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LEARNER: PAST PAPERS ───

function PapersScreen({ onBack }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? PAST_PAPERS : PAST_PAPERS.filter(p => p.status === filter);
  return (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "'Outfit', sans-serif" }}>Past Papers</h2>
      </div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4, marginBottom: 16 }}>AI-powered step-by-step marking & feedback</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["all", "new", "marked"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 16px", borderRadius: 20, border: "1px solid", borderColor: filter === f ? "#E8553A" : "rgba(255,255,255,0.1)", background: filter === f ? "rgba(232,85,58,0.15)" : "transparent", color: filter === f ? "#E8553A" : "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer", textTransform: "capitalize" }}>{f}</button>
        ))}
      </div>
      {filtered.map((paper, i) => (
        <div key={i} style={{ padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>{paper.subject}</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{paper.year} · {paper.paper}</p>
          </div>
          {paper.status === "marked" ? (
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: paper.score >= 60 ? "#2EAD6B" : paper.score >= 40 ? "#FFB930" : "#E8553A" }}>{paper.score}%</p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>AI Marked</p>
            </div>
          ) : <span style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(232,85,58,0.15)", color: "#E8553A", cursor: "pointer" }}>Start →</span>}
        </div>
      ))}
    </div>
  );
}

// ─── LEARNER: PROGRESS ───

function ProgressScreen({ onBack }) {
  return (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "'Outfit', sans-serif" }}>My Progress</h2>
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", margin: "20px 0 28px" }}>
        {SUBJECTS.map(sub => (
          <div key={sub.id} style={{ textAlign: "center" }}>
            <CircularProgress value={sub.progress} size={64} stroke={5} color={sub.color}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{sub.progress}%</span>
            </CircularProgress>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>{sub.name.split(" ")[0]}</p>
          </div>
        ))}
      </div>
      <div style={{ padding: 16, borderRadius: 14, background: "linear-gradient(135deg, rgba(46,173,107,0.1), rgba(46,173,107,0.05))", border: "1px solid rgba(46,173,107,0.2)", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Bachelor Pass Probability</p>
            <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 700, color: "#2EAD6B", fontFamily: "'Outfit', sans-serif" }}>68%</p>
          </div>
          <div style={{ textAlign: "right" }}><p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#2EAD6B" }}>↑ Improving</p></div>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>Focus: Improve Mathematics to 55%+ for a strong bachelor pass.</p>
      </div>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif" }}>Today's Path</h3>
      {[{ time: "25 min", topic: "Calculus: Chain Rule Practice", sub: "Mathematics", done: true }, { time: "20 min", topic: "Newton's 2nd Law Problems", sub: "Physical Sciences", done: false }, { time: "15 min", topic: "Essay Structure Review", sub: "English FAL", done: false }].map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, marginBottom: 8, background: item.done ? "rgba(46,173,107,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${item.done ? "rgba(46,173,107,0.15)" : "rgba(255,255,255,0.06)"}` }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${item.done ? "#2EAD6B" : "rgba(255,255,255,0.15)"}`, background: item.done ? "#2EAD6B" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>{item.done ? "✓" : ""}</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: item.done ? "rgba(255,255,255,0.4)" : "#fff", textDecoration: item.done ? "line-through" : "none" }}>{item.topic}</p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{item.sub}</p>
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{item.time}</span>
        </div>
      ))}
    </div>
  );
}

// ─── ADMIN: STUDENT DETAIL ───

function StudentDetail({ student, onBack }) {
  return (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "'Outfit', sans-serif" }}>Learner Profile</h2>
      </div>

      <div style={{ padding: 20, borderRadius: 16, marginBottom: 20, background: "linear-gradient(135deg, rgba(58,143,232,0.1), rgba(155,93,229,0.08))", border: "1px solid rgba(58,143,232,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, background: "linear-gradient(135deg, #3A8FE8, #9B5DE5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{student.avatar}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{student.name}</h3>
              <RiskBadge risk={student.risk} />
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{student.school} · Grade {student.grade}</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
          {[{ label: "Avg Score", value: student.avgScore + "%", color: student.avgScore >= 50 ? "#2EAD6B" : "#E8553A" }, { label: "Streak", value: student.streak + "d", color: student.streak > 0 ? "#FFB930" : "rgba(255,255,255,0.3)" }, { label: "Study/wk", value: student.studyMin + "m", color: "#3A8FE8" }].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "'Outfit', sans-serif" }}>{s.value}</p>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, borderRadius: 14, marginBottom: 20, background: student.bachelorProb >= 50 ? "rgba(46,173,107,0.06)" : "rgba(232,85,58,0.06)", border: `1px solid ${student.bachelorProb >= 50 ? "rgba(46,173,107,0.2)" : "rgba(232,85,58,0.2)"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Bachelor Pass Probability</p>
            <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: student.bachelorProb >= 50 ? "#2EAD6B" : "#E8553A" }}>{student.bachelorProb}%</p>
          </div>
          <div style={{ textAlign: "right" }}><TrendArrow trend={student.trend} /><p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "capitalize" }}>{student.trend}</p></div>
        </div>
      </div>

      <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif" }}>Subject Scores</h3>
      {[{ name: "Mathematics", val: student.maths, color: "#E8553A" }, { name: "Physical Sciences", val: student.physics, color: "#3A8FE8" }, { name: "Life Sciences", val: student.lifeSci, color: "#2EAD6B" }, { name: "English FAL", val: student.english, color: "#9B5DE5" }].map((sub, i) => (
        <div key={i} style={{ padding: 12, borderRadius: 12, marginBottom: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{sub.name}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: sub.val >= 50 ? sub.color : "#E8553A", fontFamily: "'Outfit', sans-serif" }}>{sub.val}%</span>
          </div>
          <ScoreBar value={sub.val} color={sub.val >= 50 ? sub.color : "#E8553A"} />
        </div>
      ))}

      <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "20px 0 12px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif" }}>Activity</h3>
      <div style={{ padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
        {[{ label: "Last Active", value: student.lastActive }, { label: "Papers Completed", value: student.papers }, { label: "Weakest Topic", value: student.weakTopic }, { label: "Study This Week", value: student.studyMin + " min" }].map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{item.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{item.value}</span>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif" }}>Intervention Actions</h3>
      {[{ label: "Generate Remedial Plan", icon: "🎯", desc: `Focus on ${student.weakTopic}` }, { label: "Create Custom Worksheet", icon: "📄", desc: "Based on weak areas" }, { label: "Send Parent Notification", icon: "📧", desc: "Alert about progress" }, { label: "Schedule Check-in", icon: "📅", desc: "Set a follow-up reminder" }].map((a, i) => (
        <div key={i} style={{ padding: "12px 14px", borderRadius: 12, cursor: "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{a.icon}</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff" }}>{a.label}</p>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{a.desc}</p>
          </div>
          <span style={{ fontSize: 12, color: "#3A8FE8" }}>→</span>
        </div>
      ))}
    </div>
  );
}

// ─── ADMIN: MAIN DASHBOARD ───

function AdminDashboard({ onSwitchToLearner }) {
  const [tab, setTab] = useState("overview");
  const [schoolFilter, setSchoolFilter] = useState("All Schools");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sortBy, setSortBy] = useState("risk");

  const filtered = schoolFilter === "All Schools" ? STUDENTS : STUDENTS.filter(s => s.school === schoolFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "risk") return ({ high: 0, medium: 1, low: 2 })[a.risk] - ({ high: 0, medium: 1, low: 2 })[b.risk];
    if (sortBy === "score") return a.avgScore - b.avgScore;
    if (sortBy === "active") return a.studyMin - b.studyMin;
    return a.name.localeCompare(b.name);
  });

  const highRisk = filtered.filter(s => s.risk === "high").length;
  const medRisk = filtered.filter(s => s.risk === "medium").length;
  const lowRisk = filtered.filter(s => s.risk === "low").length;
  const avgScore = Math.round(filtered.reduce((a, s) => a + s.avgScore, 0) / filtered.length);
  const avgStudy = Math.round(filtered.reduce((a, s) => a + s.studyMin, 0) / filtered.length);
  const totalPapers = filtered.reduce((a, s) => a + s.papers, 0);

  if (selectedStudent) return <StudentDetail student={selectedStudent} onBack={() => setSelectedStudent(null)} />;

  return (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16, marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>Northern Cape Dashboard</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "2px 0 0", color: "#fff", fontFamily: "'Outfit', sans-serif" }}>Teacher View</h1>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, margin: "12px 0 16px", overflowX: "auto" }}>
        {["overview", "learners", "alerts", "tools"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 14px", borderRadius: 20, border: "1px solid", borderColor: tab === t ? "#3A8FE8" : "rgba(255,255,255,0.08)", background: tab === t ? "rgba(58,143,232,0.15)" : "transparent", color: tab === t ? "#3A8FE8" : "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer", textTransform: "capitalize", whiteSpace: "nowrap", fontWeight: tab === t ? 600 : 400 }}>{t}</button>
        ))}
      </div>

      <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 12, marginBottom: 16, outline: "none" }}>
        {SCHOOLS.map(s => <option key={s} value={s} style={{ background: "#1a1c24" }}>{s}</option>)}
      </select>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[{ label: "High Risk", value: highRisk, color: "#E8553A" }, { label: "Medium", value: medRisk, color: "#FFB930" }, { label: "On Track", value: lowRisk, color: "#2EAD6B" }].map((r, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 14, textAlign: "center", background: r.color + "08", border: `1px solid ${r.color}20` }}>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: r.color, fontFamily: "'Outfit', sans-serif" }}>{r.value}</p>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{r.label}</p>
            </div>
          ))}
        </div>

        <div style={{ padding: 16, borderRadius: 14, marginBottom: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Class Average</p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: avgScore >= 50 ? "#2EAD6B" : "#E8553A", fontFamily: "'Outfit', sans-serif" }}>{avgScore}%</p>
          </div>
          <AreaChart data={MONTHLY_TRENDS.map(d => ({ value: d.avg, label: d.month }))} color="#3A8FE8" height={80} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {MONTHLY_TRENDS.filter((_, i) => i % 3 === 0).map(d => <span key={d.month} style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{d.month}</span>)}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[{ label: "Avg Study/Week", value: avgStudy + "m", icon: "⏱" }, { label: "Papers Done", value: totalPapers, icon: "📝" }, { label: "Active Today", value: filtered.filter(s => s.lastActive === "today").length, icon: "✅" }, { label: "Pred. Bachelor", value: Math.round(filtered.filter(s => s.bachelorProb >= 50).length / filtered.length * 100) + "%", icon: "🎓" }].map((s, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif" }}>Subject Averages</h3>
        {[{ name: "Mathematics", val: Math.round(filtered.reduce((a, s) => a + s.maths, 0) / filtered.length), color: "#E8553A" }, { name: "Physical Sciences", val: Math.round(filtered.reduce((a, s) => a + s.physics, 0) / filtered.length), color: "#3A8FE8" }, { name: "Life Sciences", val: Math.round(filtered.reduce((a, s) => a + s.lifeSci, 0) / filtered.length), color: "#2EAD6B" }, { name: "English FAL", val: Math.round(filtered.reduce((a, s) => a + s.english, 0) / filtered.length), color: "#9B5DE5" }].map((sub, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", width: 90 }}>{sub.name}</span>
            <div style={{ flex: 1 }}><ScoreBar value={sub.val} color={sub.color} /></div>
            <span style={{ fontSize: 13, fontWeight: 700, color: sub.color, fontFamily: "'Outfit', sans-serif", width: 32, textAlign: "right" }}>{sub.val}%</span>
          </div>
        ))}
      </>}

      {/* ── LEARNERS ── */}
      {tab === "learners" && <>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {[{ id: "risk", label: "Risk" }, { id: "score", label: "Score" }, { id: "active", label: "Activity" }, { id: "name", label: "Name" }].map(s => (
            <button key={s.id} onClick={() => setSortBy(s.id)} style={{ padding: "5px 10px", borderRadius: 16, border: "1px solid", borderColor: sortBy === s.id ? "#3A8FE8" : "rgba(255,255,255,0.08)", background: sortBy === s.id ? "rgba(58,143,232,0.12)" : "transparent", color: sortBy === s.id ? "#3A8FE8" : "rgba(255,255,255,0.35)", fontSize: 10, cursor: "pointer" }}>{s.label}</button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 12px" }}>{sorted.length} learner{sorted.length !== 1 ? "s" : ""}</p>
        {sorted.map(student => (
          <button key={student.id} onClick={() => setSelectedStudent(student)} style={{ padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", textAlign: "left", width: "100%", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: student.risk === "high" ? "rgba(232,85,58,0.15)" : student.risk === "medium" ? "rgba(255,185,48,0.15)" : "rgba(46,173,107,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{student.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>{student.name}</p>
                  <TrendArrow trend={student.trend} />
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{student.school} · Gr {student.grade}</p>
              </div>
              <RiskBadge risk={student.risk} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
              {[{ label: "Maths", val: student.maths, color: "#E8553A" }, { label: "Physics", val: student.physics, color: "#3A8FE8" }, { label: "Life Sci", val: student.lifeSci, color: "#2EAD6B" }, { label: "English", val: student.english, color: "#9B5DE5" }].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", width: 42 }}>{s.label}</span>
                  <div style={{ flex: 1 }}><ScoreBar value={s.val} color={s.color} /></div>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", width: 22, textAlign: "right" }}>{s.val}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Active: {student.lastActive}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{student.studyMin}m/wk · 🔥{student.streak}d</span>
              <span style={{ fontSize: 10, color: "#3A8FE8" }}>View →</span>
            </div>
          </button>
        ))}
      </>}

      {/* ── ALERTS ── */}
      {tab === "alerts" && <>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif" }}>Early Warning System</h3>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 16px" }}>AI-flagged learners needing intervention</p>

        {filtered.filter(s => s.risk === "high").length > 0 && (
          <div style={{ padding: 14, borderRadius: 14, marginBottom: 16, background: "rgba(232,85,58,0.06)", border: "1px solid rgba(232,85,58,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>🚨</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#E8553A", fontFamily: "'Outfit', sans-serif" }}>Urgent — {filtered.filter(s => s.risk === "high").length} learners need attention</span>
            </div>
            {filtered.filter(s => s.risk === "high").map((s, i) => (
              <div key={i} style={{ padding: "10px 12px", borderRadius: 10, marginBottom: 6, background: "rgba(232,85,58,0.06)", border: "1px solid rgba(232,85,58,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff" }}>{s.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Avg: {s.avgScore}% · Weak: {s.weakTopic}</p>
                </div>
                <button onClick={() => setSelectedStudent(s)} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(232,85,58,0.3)", background: "rgba(232,85,58,0.1)", color: "#E8553A", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Intervene</button>
              </div>
            ))}
          </div>
        )}

        <h4 style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)", margin: "0 0 10px", fontFamily: "'Outfit', sans-serif" }}>⏰ Inactive Learners</h4>
        {filtered.filter(s => s.streak === 0).map((s, i) => (
          <div key={i} style={{ padding: 12, borderRadius: 12, marginBottom: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>😴</span>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#fff" }}>{s.name}</p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Last active: {s.lastActive}</p>
              </div>
            </div>
            <RiskBadge risk={s.risk} />
          </div>
        ))}

        <h4 style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)", margin: "16px 0 10px", fontFamily: "'Outfit', sans-serif" }}>📉 Declining Performance</h4>
        {filtered.filter(s => s.trend === "declining").map((s, i) => (
          <div key={i} style={{ padding: 12, borderRadius: 12, marginBottom: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TrendArrow trend="declining" />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#fff" }}>{s.name}</p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Avg: {s.avgScore}% · Weakest: {s.weakTopic}</p>
              </div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#E8553A", fontFamily: "'Outfit', sans-serif" }}>{s.bachelorProb}%</span>
          </div>
        ))}

        <h4 style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)", margin: "16px 0 10px", fontFamily: "'Outfit', sans-serif" }}>🎓 Low Bachelor Pass (&lt;30%)</h4>
        {filtered.filter(s => s.bachelorProb < 30).map((s, i) => (
          <div key={i} style={{ padding: 12, borderRadius: 12, marginBottom: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#fff" }}>{s.name}</p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{s.school} · Gr {s.grade}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#E8553A", fontFamily: "'Outfit', sans-serif" }}>{s.bachelorProb}%</p>
              <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.25)" }}>bach. prob.</p>
            </div>
          </div>
        ))}
      </>}

      {/* ── TOOLS ── */}
      {tab === "tools" && <>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif" }}>Teacher Tools</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[{ icon: "📄", title: "Generate Worksheet", desc: "Auto-create from weak topics", color: "#E8553A" }, { icon: "🎯", title: "Remedial Plan", desc: "AI per-learner intervention", color: "#3A8FE8" }, { icon: "📊", title: "Export Report", desc: "NCDoE-ready progress reports", color: "#2EAD6B" }, { icon: "📧", title: "Parent Alert", desc: "Auto-draft notifications", color: "#9B5DE5" }, { icon: "📋", title: "Class Overview", desc: "Print-ready class summary", color: "#FFB930" }, { icon: "🧪", title: "Diagnostic Test", desc: "Generate baseline assessment", color: "#E8553A" }].map((tool, i) => (
            <div key={i} style={{ padding: 16, borderRadius: 14, cursor: "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 26, display: "block", marginBottom: 8 }}>{tool.icon}</span>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff" }}>{tool.title}</p>
              <p style={{ margin: "4px 0 0", fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{tool.desc}</p>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif" }}>NCDoE Quick Stats</h3>
        <div style={{ padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {[{ label: "Total Learners", value: filtered.length }, { label: "Active This Week", value: filtered.filter(s => s.lastActive === "today" || s.lastActive.includes("1 day")).length }, { label: "Avg Study/Week", value: avgStudy + " min" }, { label: "Papers Completed", value: totalPapers }, { label: "Pred. Bachelor Pass Rate", value: Math.round(filtered.filter(s => s.bachelorProb >= 50).length / filtered.length * 100) + "%" }, { label: "Improvement Since Jan", value: "+19%" }].map((stat, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{stat.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{stat.value}</span>
            </div>
          ))}
        </div>
      </>}
    </div>
  );
}

// ─── MAIN APP ───

export default function App() {
  const [mode, setMode] = useState("learner");
  const [screen, setScreen] = useState("home");
  const [subjectId, setSubjectId] = useState("maths");

  const navigate = (s, sub) => { setScreen(s); if (sub) setSubjectId(sub); };
  const goHome = () => { setScreen("home"); setMode("learner"); };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", background: "#0D0F14", fontFamily: "'DM Sans', -apple-system, sans-serif", color: "#fff", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; }
        ::-webkit-scrollbar { width: 0; }
        input::placeholder { color: rgba(255,255,255,0.3); }
        button { font-family: 'DM Sans', sans-serif; }
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      <div style={{ position: "fixed", top: -100, right: -100, width: 300, height: 300, borderRadius: "50%", background: mode === "admin" ? "radial-gradient(circle, rgba(58,143,232,0.08), transparent 70%)" : "radial-gradient(circle, rgba(232,85,58,0.08), transparent 70%)", pointerEvents: "none" }} />

      {/* Top Bar */}
      {screen !== "tutor" && (
        <div style={{ padding: "12px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: mode === "admin" ? "linear-gradient(135deg, #3A8FE8, #9B5DE5)" : "linear-gradient(135deg, #E8553A, #FF8C42)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>M</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>Matric Mastery</span>
          </div>
          <button onClick={() => { const next = mode === "learner" ? "admin" : "learner"; setMode(next); setScreen(next === "admin" ? "admin" : "home"); }} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid", borderColor: mode === "admin" ? "rgba(58,143,232,0.3)" : "rgba(255,255,255,0.1)", background: mode === "admin" ? "rgba(58,143,232,0.12)" : "rgba(255,255,255,0.04)", color: mode === "admin" ? "#3A8FE8" : "rgba(255,255,255,0.5)", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
            {mode === "admin" ? "👨‍🏫 Admin" : "📚 Learner"}
          </button>
        </div>
      )}

      {/* Screens */}
      <div style={{ height: screen === "tutor" ? "100vh" : "auto" }}>
        {screen === "home" && <HomeScreen onNavigate={navigate} learnerName="Keitumetse" />}
        {screen === "tutor" && <TutorScreen subjectId={subjectId} onBack={goHome} />}
        {screen === "papers" && <PapersScreen onBack={goHome} />}
        {screen === "progress" && <ProgressScreen onBack={goHome} />}
        {screen === "admin" && <AdminDashboard onSwitchToLearner={goHome} />}
      </div>

      {/* Bottom Nav */}
      {screen !== "tutor" && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, padding: "10px 20px 18px", display: "flex", justifyContent: "space-around", background: "linear-gradient(to top, rgba(13,15,20,0.98), rgba(13,15,20,0.85))", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {mode === "learner" ? (
            [{ id: "home", icon: "🏠", label: "Home" }, { id: "tutor", icon: "🤖", label: "AI Tutor", sub: "maths" }, { id: "papers", icon: "📝", label: "Papers" }, { id: "progress", icon: "📊", label: "Progress" }].map(tab => (
              <button key={tab.id} onClick={() => navigate(tab.id, tab.sub)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "center", padding: "4px 8px" }}>
                <span style={{ fontSize: 20, display: "block", opacity: screen === tab.id ? 1 : 0.4 }}>{tab.icon}</span>
                <span style={{ fontSize: 10, display: "block", marginTop: 2, color: screen === tab.id ? "#E8553A" : "rgba(255,255,255,0.3)", fontWeight: screen === tab.id ? 600 : 400 }}>{tab.label}</span>
              </button>
            ))
          ) : (
            [{ id: "admin", icon: "📊", label: "Dashboard" }, { id: "home", icon: "📚", label: "Learner View", action: goHome }].map(tab => (
              <button key={tab.id} onClick={tab.action || (() => setScreen(tab.id))} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "center", padding: "4px 16px" }}>
                <span style={{ fontSize: 20, display: "block", opacity: screen === tab.id ? 1 : 0.4 }}>{tab.icon}</span>
                <span style={{ fontSize: 10, display: "block", marginTop: 2, color: screen === tab.id ? "#3A8FE8" : "rgba(255,255,255,0.3)", fontWeight: screen === tab.id ? 600 : 400 }}>{tab.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
