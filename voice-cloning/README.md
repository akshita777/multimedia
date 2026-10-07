# Voice Cloning & Speech Synthesis Module

Instant Voice Cloning (IVC) and Neural Text-to-Speech (TTS) engine built with **ElevenLabs API**, Node.js/Express, and FFmpeg fallback.

Extracts vocal characteristics, timbre, and acoustic properties from a short reference audio sample (5–30 seconds), creates a cloned voice profile, and synthesizes new speech dynamically from text prompts.

---

## 🚀 Features

* **Instant Voice Cloning (IVC):** Upload any voice recording (MP3, WAV, M4A) or use the included sample (`samples/speech_sample.mp3`) to clone a speaker's voice.
* **Neural Text-to-Speech:** Type any custom text or select preset prompts to generate high-fidelity speech in the cloned voice.
* **Dual Operation Modes:**
  * **Production Mode:** Connects to ElevenLabs API using your API key for state-of-the-art neural cloning (`eleven_multilingual_v2`).
  * **Offline / Simulation Mode:** Runs out-of-the-box using FFmpeg acoustic processing when an API key is not yet configured, ensuring zero setup friction.
* **Interactive Web Studio:** Dark-mode/light-mode clean interface with drag-and-drop audio upload, audio players, quick-prompt chips, and direct MP3 download.
* **CLI Utility:** Fully functional Python command-line tool (`clone_voice.py`) for automated batch workflows and headless environments.

---

## 📁 Module Structure

```
voice-cloning/
├── server.js              # Express API server & ElevenLabs proxy
├── clone_voice.py         # Python CLI interface for voice cloning
├── package.json           # Node.js dependencies
├── .env.example           # Environment template
├── .env                   # Configuration file (API keys, port)
├── README.md              # Documentation
└── public/                # Web Studio Frontend
    ├── index.html         # User interface
    ├── style.css          # Styling & responsive design
    └── app.js             # Client-side controller
```

---

## 🛠️ Quick Start

### 1. Web Studio

```bash
# Navigate to module
cd voice-cloning

# Install dependencies (already installed)
npm install

# Start the server (runs on http://localhost:3001)
npm start
```

Open your browser to `http://localhost:3001`.

### 2. Python CLI

```bash
python clone_voice.py \
  --sample ../samples/speech_sample.mp3 \
  --name "Speaker1" \
  --text "Hello, this is a test of AI voice cloning." \
  --output cloned_speech.mp3
```

---

## ⚙️ Configuration (.env)

Edit `voice-cloning/.env`:

```env
# ElevenLabs API Key (Get free key from https://elevenlabs.io)
ELEVENLABS_API_KEY=your_key_here

# Server port
PORT=3001
```

If `ELEVENLABS_API_KEY` is left as default, the application automatically functions in **Simulation Mode** using local FFmpeg acoustic modeling.
