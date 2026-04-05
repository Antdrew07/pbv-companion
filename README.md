# YB Protocol — Personal Health Companion

A Progressive Web App (PWA) designed as a personal health, peptide, and supplement protocol tracker for Yahya Bakkar.

## Features

- **Daily Protocol Tracker**: Track morning, evening, and bedtime injections and supplements.
- **Optimized Peptide Timing**: Built-in timing logic (e.g., CJC-1295/Ipamorelin at bedtime for optimal GH pulses, Semax/BPC-157 in the morning).
- **Midnight Auto-Reset**: Daily checklists automatically clear at midnight while preserving your streak data.
- **AI Health Coach**: Connect your OpenAI API key to chat with an AI coach that knows your exact bloodwork, protocol, and goals.
- **Wellness Journal**: Track daily energy, libido, sleep, and mood scores.
- **Bloodwork Dashboard**: Quick reference for key biomarkers (LDL, Testosterone, Ferritin, etc.).
- **Protocol Manager**: Add, edit, or remove custom compounds from your stack.
- **Offline Support**: Works as a standalone PWA on iOS and Android.

## Setup & Installation

Since this is a client-side PWA, no server setup is required.

1. Clone the repository or download the files.
2. Host the files on any static web server (e.g., GitHub Pages, Vercel, Netlify).
3. Open the URL on your mobile device.
4. Tap **Share > Add to Home Screen** to install it as a native app.

## AI Coach Configuration

To use the AI Coach feature:
1. Navigate to the **AI Coach** tab.
2. Enter your OpenAI API key (`sk-...`).
3. The key is stored securely in your device's `localStorage` and is only sent directly to OpenAI's API. It is never stored on any other server.

## Technical Details

- **Frontend**: Pure HTML, CSS, and vanilla JavaScript.
- **Storage**: All data (protocol state, journal entries, streaks, custom compounds) is saved locally using `localStorage`.
- **Security**: User inputs are safely escaped to prevent XSS vulnerabilities.

## License

Personal use only.
