const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CORS ────────────────────────────────────────────────────────────────────
// Allow requests from GitHub Pages and any localhost port (for dev)
const ALLOWED_ORIGINS = [
  'https://antdrew07.github.io',
  'http://localhost',
  'http://127.0.0.1'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile PWA installed to home screen)
    if (!origin) return callback(null, true);
    const allowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));
    if (allowed) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '16kb' }));

// ─── RATE LIMITING ───────────────────────────────────────────────────────────
// 30 requests per 10 minutes per IP — enough for normal use, blocks abuse
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a few minutes and try again.' }
});
app.use('/api/', limiter);

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────
// Yahya's full protocol context — lives on the server, never exposed to client
function getSystemPrompt(weekNumber) {
  return `You are the personal AI health coach for Yahya Bakkar — direct, knowledgeable, and always reference his actual numbers. Keep replies under 200 words. Use line breaks for readability.

BLOODWORK (April 2, 2026 baseline):
- LDL: 164.1 mg/dL → target <100 (FLAGGED — top priority)
- ApoB: 107 mg/dL → target <90 (FLAGGED)
- Ferritin: 445 ng/mL → target 30-300 (ELEVATED)
- Vitamin D: 45.8 ng/mL → target 60-80 (LOW)
- Total Testosterone: 489 ng/dL → target 700-1000 (BELOW TARGET)
- Free Testosterone: 104.62 pg/mL → target >150
- SHBG: 32.4 nmol/L → target 20-30 (slightly high)
- HDL: 55.5 mg/dL, Triglycerides: 82 mg/dL, hs-CRP: <0.5 mg/L (excellent)

INJECTION PROTOCOL:
  MORNING (Fasted, upon waking):
  - Semax 1% 200mcg — Intranasal, cognitive boost
  - BPC-157 250mcg — Sub-Q, gut healing & repair
  - GLOW Blend 1 vial — Sub-Q, skin & collagen support
  - Enclomiphene 12.5mg — Oral, testosterone stimulation
  - NAD+ 250mg — Sub-Q, cellular energy & metabolism

  EVENING (1-2h after last meal):
  - Kisspeptin-10 100mcg — Sub-Q, HPT axis stimulation
  - TB-500 2.5mg — Sub-Q, tissue recovery & repair

  BEDTIME (30-60 min before sleep — maximizes GH pulse during deep sleep):
  - CJC-1295 + Ipamorelin 300mcg/300mcg — Sub-Q, GH release, fasted 2h before bed
  - DSIP 200mcg — Sub-Q, delta sleep induction

  AS NEEDED:
  - PT-141 1mg — Sub-Q

SUPPLEMENT PROTOCOL:
  WITH MEALS: Berberine 500mg 2-3x, Red Yeast Rice 600mg 2x, Omega-3 3-4g EPA/DHA, CoQ10 200mg, Lion's Mane 1000mg 2x, Ashwagandha 300mg 2x, Digestive Enzymes 1 cap
  MORNING: Vitamin D3+K2 5000IU/200mcg, Zinc+Copper 30mg/2mg, Boron 10mg, Probiotic 50B CFU
  BEDTIME: Magnesium Glycinate 400mg
  EMPTY STOMACH: IP6 1500mg (ferritin reduction)

PHASE: Week ${weekNumber} of 8 (Phase 1 — Foundation). Phase 2 adds HCG 500IU 3x/week at Week 9.
GOALS: Testosterone 800+, LDL <100, Ferritin <300, Vitamin D 60-80.

KEY TIMING NOTES:
- CJC-1295 + Ipamorelin: BEDTIME only — maximizes GH pulse during deep sleep
- DSIP: BEDTIME — delta sleep induction peptide
- Semax, BPC-157, NAD+: MORNING fasted — cognitive/repair/energy
- Kisspeptin-10, TB-500: EVENING — HPT axis & recovery`;
}

// ─── CHAT ENDPOINT ───────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages, weekNumber } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request: messages array required.' });
  }

  if (messages.length > 20) {
    return res.status(400).json({ error: 'Too many messages in context.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 400,
        temperature: 0.7,
        messages: [
          { role: 'system', content: getSystemPrompt(weekNumber || 1) },
          ...messages.slice(-14) // last 14 messages for context window
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('OpenAI error:', data.error.message);
      return res.status(502).json({ error: 'AI service error. Please try again.' });
    }

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(502).json({ error: 'No response from AI.' });
    }

    res.json({ reply });

  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(503).json({ error: 'Could not reach AI service. Check your connection.' });
  }
});

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'YB Protocol AI Proxy', timestamp: new Date().toISOString() });
});

// ─── START ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`YB Protocol AI proxy running on port ${PORT}`);
});
