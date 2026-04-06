const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Render's reverse proxy so rate limiting works correctly
app.set('trust proxy', 1);

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

PEPTIDE PROTOCOL (10 compounds — optimized per Peptides By Veterans protocol):
  MORNING (Fasted, upon waking — before breakfast):
  - NAD+ 500mg — Sub-Q or IV, cellular energy & mitochondrial repair
  - 5 Amino 1MQ 10mg — Sub-Q or capsule, synergistic with NAD+ for metabolism
  - Semax 10mg — Sub-Q or intranasal (9-15 units), cognitive amplifier & BDNF boost
  - Kisspeptin-10 — Sub-Q, HPT axis master switch — triggers GnRH → LH/FSH → testosterone
  - Enclomiphene 12.5mg — Oral with food, pituitary amplifier — blocks estrogen brake on LH/FSH
  - GLOW Mix 70mg (GHK-Cu + BPC-157 + TB-500) — Sub-Q, complete repair & glow stack
  - IGF-1 LR3 1mg — Sub-Q, 15 units — post-workout or AM on training days (5 days/week)

  EVENING (supports melatonin & circadian alignment):
  - Epitalon 10mg — Sub-Q, 15 units — telomere protection & longevity compound

  BEDTIME (empty stomach, 2+ hours after last meal — maximizes nocturnal GH pulse):
  - CJC-1295 No DAC + Ipamorelin — Sub-Q, 10 units each — gold standard GH-releasing stack (5 on / 2 off)
  - HCG 5000iu — Sub-Q, 250-500 IU — PHASE 2 ONLY (starts Week 6), Mon/Wed/Fri — direct testicular stimulation

SUPPLEMENT PROTOCOL:
  WITH MEALS: Berberine 500mg 2-3x (LDL/ApoB), Red Yeast Rice 600mg 2x (LDL synergy), Omega-3 3-4g EPA/DHA, CoQ10 Ubiquinol 200mg, Lion's Mane 1000mg 2x, Ashwagandha KSM-66 300mg 2x, Digestive Enzymes 1 cap
  MORNING: Vitamin D3+K2 5000IU/200mcg (Vitamin D 45.8 → target 60-80), Zinc+Copper 30mg/2mg, Boron 10mg, Probiotic 50B CFU
  BEDTIME: Magnesium Glycinate 400mg
  EMPTY STOMACH: IP6 1500mg (Ferritin 445 → target 30-300)

PHASE: Week ${weekNumber} of 12 (Phase 1 — Foundation, Weeks 1-5). Phase 2 (Weeks 6-12) adds HCG 250-500 IU Mon/Wed/Fri.
GOALS: Testosterone 800-1000 ng/dL, LDL <100, ApoB <90, Ferritin 30-300, Vitamin D 60-80.
TRIPLE-AXIS TESTOSTERONE STRATEGY: Kisspeptin (hypothalamus) + Enclomiphene (pituitary) + HCG Phase 2 (testes) = comprehensive HPT axis optimization.

KEY TIMING NOTES:
- CJC-1295 + Ipamorelin: BEDTIME ONLY on empty stomach — maximizes nocturnal GH pulse (5 on / 2 off)
- Kisspeptin: MORNING — aligns with natural LH pulsatility (NOT evening)
- Epitalon: EVENING — supports melatonin and circadian rhythm
- IGF-1 LR3: Post-workout or morning on training days ONLY (5 days/week) — 4-6 week cycles with 4 weeks off
- HCG: Phase 2 only (Week 6+) — do NOT start before Week 6; Kisspeptin + Enclomiphene must prime HPT axis first
- GLOW Mix REPLACES standalone BPC-157 and TB-500 — contains both plus GHK-Cu`;
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
