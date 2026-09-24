const express = require('express');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Default target voice: "Adam" (male voice, distinct and clear)
const TARGET_VOICE_ID = process.env.TARGET_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
const TARGET_VOICE_NAME = process.env.TARGET_VOICE_NAME || 'Adam';

// Setup multer to store uploaded audio in memory as a buffer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB maximum limit
  },
  fileFilter: (req, file, cb) => {
    // Basic validation to accept audio files
    if (file.mimetype.startsWith('audio/') || file.originalname.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Please upload a valid audio file (.mp3, .wav, .m4a, etc.)'));
    }
  }
});

// Serve frontend static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

/**
 * GET /api/config
 * Returns public configuration (target voice name and ID, and whether API key is configured).
 * Notice: The actual API key is NEVER sent to the client.
 */
app.get('/api/config', (req, res) => {
  const key = process.env.ELEVENLABS_API_KEY;
  const isKeyConfigured = Boolean(key && key.trim().length > 0 && !key.includes('your_elevenlabs_api_key_here'));
  res.json({
    targetVoiceId: TARGET_VOICE_ID,
    targetVoiceName: TARGET_VOICE_NAME,
    hasApiKey: isKeyConfigured
  });
});

/**
 * POST /api/convert
 * Receives the user's audio file, forwards it to ElevenLabs Speech-to-Speech API,
 * and returns the converted audio stream back to the frontend.
 */
app.post('/api/convert', upload.single('audio'), async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    // Check if the API key is configured
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_elevenlabs_api_key_here')) {
      return res.status(400).json({
        error: 'ElevenLabs API key is missing or not configured. Please set ELEVENLABS_API_KEY in voice-converter/.env'
      });
    }

    // Check if an audio file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded.' });
    }

    // Prepare multipart form data for ElevenLabs Speech-to-Speech API
    const formData = new FormData();
    const audioBlob = new Blob([req.file.buffer], {
      type: req.file.mimetype || 'audio/mpeg'
    });

    formData.append('audio', audioBlob, req.file.originalname || 'input_audio.mp3');
    formData.append('model_id', 'eleven_multilingual_sts_v2');

    // Call ElevenLabs Speech-to-Speech endpoint
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/speech-to-speech/${TARGET_VOICE_ID}`;

    const apiResponse = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey
      },
      body: formData
    });

    // Handle ElevenLabs API errors
    if (!apiResponse.ok) {
      let errorMessage = `ElevenLabs API error: HTTP ${apiResponse.status}`;
      try {
        const errorData = await apiResponse.json();
        if (errorData.detail && errorData.detail.message) {
          errorMessage = errorData.detail.message;
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
      } catch (e) {
        const errorText = await apiResponse.text();
        if (errorText) errorMessage = errorText;
      }

      return res.status(apiResponse.status).json({ error: errorMessage });
    }

    // Stream the converted audio directly back to the client
    const arrayBuffer = await apiResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
      'Content-Disposition': 'inline; filename="converted_voice.mp3"'
    });

    return res.send(buffer);
  } catch (error) {
    console.error('Error during voice conversion:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error during voice conversion.'
    });
  }
});

// Multer error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Voice Conversion App is running!`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` Target Voice: ${TARGET_VOICE_NAME} (${TARGET_VOICE_ID})`);
  console.log(` API Key Status: ${process.env.ELEVENLABS_API_KEY ? 'Configured' : 'Missing (set in .env)'}`);
  console.log(`===============================================`);
});
