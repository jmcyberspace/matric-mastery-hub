// ─── RATE LIMITER ───
const rateLimitMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > 60000) { rateLimitMap.set(ip, { start: now, count: 1 }); return false; }
  entry.count++;
  return entry.count > 20;
}

// ─── SYSTEM PROMPTS ───
const SYSTEM_PROMPTS = {
  maths: `You are Mastery AI, a warm and encouraging Mathematics tutor for South African matric (Grade 12) students following the CAPS curriculum. You are powered by JM CYBER SPACE.
- Explain concepts step-by-step with worked examples
- Use past paper style questions when relevant
- Be encouraging but honest about mistakes
- Use Unicode math notation (², ³, √, π, ≤, ≥, →)
- Cover: Algebra, Functions, Calculus, Financial Maths, Probability, Trig, Geometry, Stats, Number Patterns
- Keep responses concise for mobile chat
- The student is Keitumetse, Grade 12, scoring 62% in maths. Weak area: Calculus (chain rule). 12-day study streak.`,

  physics: `You are Mastery AI, a warm Physical Sciences tutor for SA matric students following CAPS. Powered by JM CYBER SPACE.
- Use proper SI units and formulae
- Cover: Mechanics, Waves, Electricity, Matter & Materials, Chemical Change
- The student is Keitumetse, Grade 12, scoring 45%. Weak area: Newton's Laws.`,

  "life-sci": `You are Mastery AI, a warm Life Sciences tutor for SA matric students following CAPS. Powered by JM CYBER SPACE.
- Help with terminology and definitions
- Cover: DNA, Meiosis, Genetics, Evolution, Nervous System, Endocrine, Reproduction, Human Impact
- The student is Keitumetse, Grade 12, scoring 78%. Push for distinction.`,

  english: `You are Mastery AI, a warm English FAL tutor for SA matric students following CAPS. Powered by JM CYBER SPACE.
- Help with comprehension, summary, grammar, essay writing, literature
- The student is Keitumetse, Grade 12, scoring 71%. Focus on essay structure.`,
};

// ─── MODELS TO TRY (in order of preference) ───
const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash", 
  "gemini-1.5-flash",
];

async function callGemini(apiKey, model, systemPrompt, messages) {
  const geminiContents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content || "" }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: geminiContents,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`${model} failed (${response.status}): ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  
  // Check for blocked or empty responses
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    const text = data.candidates[0].content.parts?.map(p => p.text).join("\n");
    if (text && text.trim().length > 0) return text;
  }
  
  // Check if there's a prompt feedback block
  if (data.promptFeedback && data.promptFeedback.blockReason) {
    throw new Error(`Blocked: ${data.promptFeedback.blockReason}`);
  }

  throw new Error(`${model} returned empty response`);
}

// ─── HANDLER ───
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Rate limit
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || "unknown";
  if (isRateLimited(ip)) return res.status(429).json({ error: "Too many requests. Wait a moment." });

  const { subjectId, messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Messages required" });

  const validSubjects = ["maths", "physics", "life-sci", "english"];
  const subject = validSubjects.includes(subjectId) ? subjectId : "maths";

  // Input length cap
  const totalLen = messages.reduce((a, m) => a + (m.content || "").length, 0);
  if (totalLen > 10000) return res.status(400).json({ error: "Message too long" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not set");
    return res.status(500).json({ error: "AI not configured" });
  }

  const systemPrompt = SYSTEM_PROMPTS[subject];

  // Try each model in order
  for (const model of MODELS) {
    try {
      const text = await callGemini(apiKey, model, systemPrompt, messages);
      console.log(`Success with ${model}`);
      return res.status(200).json({ text });
    } catch (err) {
      console.error(`${model} error:`, err.message);
      continue; // Try next model
    }
  }

  // All models failed
  return res.status(502).json({ error: "AI service temporarily unavailable" });
}
