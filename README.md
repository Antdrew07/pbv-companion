# YB Protocol — Personal Health Companion

A Progressive Web App (PWA) designed as a personal health, peptide, and supplement protocol tracker for Yahya Bakkar.

## Features

- **Daily Protocol Tracker**: Track morning, evening, and bedtime injections and supplements with optimized timing.
- **Optimized Peptide Timing**: CJC-1295/Ipamorelin at bedtime for optimal GH pulses, Semax/BPC-157 fasted in the morning, Kisspeptin-10 and TB-500 in the evening.
- **Midnight Auto-Reset**: Daily checklists automatically clear at midnight while preserving streak data.
- **AI Health Coach**: Fully integrated — pre-loaded with Yahya's bloodwork, protocol, and goals. No API key required by the user. Works via a secure backend proxy.
- **Wellness Journal**: Track daily energy, libido, sleep, and mood scores.
- **Bloodwork Dashboard**: Quick reference for key biomarkers (LDL, Testosterone, Ferritin, etc.).
- **Protocol Manager**: Add, edit, or remove custom compounds from the stack.
- **Offline Support**: Works as a standalone PWA on iOS and Android.

## Architecture

```
[Yahya's Phone / Browser]
        |
        | HTTPS POST /api/chat
        v
[Render.com — server/server.js]   <- API key lives here, never exposed
        |
        | HTTPS POST
        v
[OpenAI API — gpt-4o-mini]
```

The frontend (`index.html`) never touches the OpenAI API key directly. All AI requests go through the proxy server which holds the key as a secure environment variable.

## Setup & Installation

### Frontend (GitHub Pages)

The app is automatically deployed via GitHub Pages. Open the URL on your mobile device and tap **Share > Add to Home Screen** to install it as a native app.

### Backend Proxy Server (Render.com)

1. Go to [render.com](https://render.com) and create a new **Web Service**.
2. Connect this GitHub repository.
3. Set **Root Directory** to `server`.
4. Set **Build Command** to `npm install`.
5. Set **Start Command** to `npm start`.
6. Add the environment variable: `OPENAI_API_KEY` = your OpenAI key.
7. Copy the deployed URL (e.g. `https://pbv-companion-ai.onrender.com`).
8. Update `AI_PROXY_URL` in `index.html` to match your Render URL.

## Technical Details

- **Frontend**: Pure HTML, CSS, and vanilla JavaScript (single file PWA).
- **Backend**: Node.js + Express proxy server with CORS and rate limiting.
- **Storage**: All data (protocol state, journal entries, streaks, custom compounds) saved locally via `localStorage`.
- **Security**: User inputs safely escaped (XSS prevention). API key never exposed to client.

## License

Personal use only.
