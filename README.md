# Final Project — Consolidated Multimedia Analyzer

Accepts any media file (Image, Audio, Video), auto-detects the type, routes it to the correct analyzer module, and produces a structured JSON report.

## Project Structure
```
final-Multimedia/
├── multimedia_analyzer/          # Python Multimedia Metadata Analyzer
│   ├── main.py
│   ├── file_utils.py
│   ├── image_analyzer.py
│   ├── audio_analyzer.py
│   ├── video_analyzer.py
│   ├── report_generator.py
│   ├── samples/
│   │   ├── sample.jpg
│   │   ├── sample.mp3
│   │   └── sample.mp4
│   └── reports/
│       └── report.json
│
└── voice-converter/              # ElevenLabs Speech-to-Speech Voice Converter
    ├── server.js                 # Express server & ElevenLabs API proxy
    ├── package.json              # Node dependencies (express, multer, dotenv)
    ├── .env.example              # Environment variables template
    ├── README.md                 # Detailed module documentation
    ├── demo.png                  # UI demo preview
    └── public/                   # Plain HTML/CSS/JS web frontend
        ├── index.html
        ├── style.css
        └── app.js
```

## Usage
```bash
python main.py samples/sample.jpg
python main.py samples/sample.mp3
python main.py samples/sample.mp4
```

## Requirements
```
pip install Pillow mutagen
# Also: FFmpeg installed on system
```

## Sample Files

### Image
![sample](samples/sample.jpg)

### Audio
▶️ [sample.mp3](samples/sample.mp3)

### Video
▶️ [sample.mp4](samples/sample.mp4)


## Sample Report Output
```json
{
    "File Type Identified": "VIDEO",
    "File Name": "sample.mp4",
    "File Size": "0.75 MB",
    "Container": "QuickTime / MOV",
    "Duration": "10.03 seconds",
    "Video": {
        "Resolution": "320x176",
        "Frame Rate": "25/1",
        "Bit Rate": "300 kbps",
        "Codec": "h264"
    },
    "Audio": {
        "Codec": "aac",
        "Channels": "2",
        "Sampling Rate": "48000 Hz",
        "Bit Rate": "160 kbps"
    },
    "Metadata": {
        "major_brand": "mp42",
        "creation_time": "2012-03-13T08:58:06.000000Z",
        "encoder": "HandBrake 0.9.6 2012022800"
    }
}
```

---

## 🎙️ Voice Converter Module (ElevenLabs Speech-to-Speech)

A lightweight web application that transforms any input voice recording into a distinct target voice using **ElevenLabs Speech-to-Speech (STS)**.

### Working Demo Video & Preview

![Voice Converter Working Demo](voice-converter/demo.gif)

🎬 **[Watch / Download Full Demo Video with Human Voice Audio (demo.mp4)](voice-converter/demo.mp4)**
*(Demonstrates an original human female voice saying "I am female, I am speaking English..." converted into Adam's deep male voice while preserving the natural pacing and inflection).*

### Features
* **Real Human Voice Conversion:** Changes vocal timbre and identity to a target speaker (Default: **Adam**) while preserving emotional inflection, phrasing, and pacing.
* **Ready-to-test Voice Sample:** Includes a sample spoken audio clip (`samples/speech_sample.mp3`) for instant testing.
* **Audio Player & Instant Download:** Listen to both original and converted audio side-by-side, and download the resulting `.mp3`.
* **Safe Key Handling:** ElevenLabs API key is securely stored in `.env` on a tiny Node.js/Express backend—never exposed to the frontend.

### Quick Start
```bash
# 1. Enter module directory
cd voice-converter

# 2. Install dependencies
npm install

# 3. Configure API key
cp .env.example .env
# Edit .env and set ELEVENLABS_API_KEY=your_key

# 4. Start the server
npm start
```
Visit `http://localhost:3000` in your browser. For full documentation, see [voice-converter/README.md](voice-converter/README.md).
