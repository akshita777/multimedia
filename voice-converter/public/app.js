// Voice Converter Frontend Logic

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const audioInput = document.getElementById('audioInput');
  const dropArea = document.getElementById('dropArea');
  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const convertBtn = document.getElementById('convertBtn');
  const btnSpinner = document.getElementById('btnSpinner');
  const statusMessage = document.getElementById('statusMessage');
  const originalAudioContainer = document.getElementById('originalAudioContainer');
  const originalAudioPlayer = document.getElementById('originalAudioPlayer');
  const outputSection = document.getElementById('outputSection');
  const convertedAudioPlayer = document.getElementById('convertedAudioPlayer');
  const downloadBtn = document.getElementById('downloadBtn');
  const targetVoiceDisplay = document.getElementById('targetVoiceDisplay');
  const apiKeyStatus = document.getElementById('apiKeyStatus');

  let selectedFile = null;
  let convertedAudioUrl = null;

  // 1. Fetch server configuration (target voice info & key status)
  async function loadConfig() {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const config = await res.json();
        targetVoiceDisplay.textContent = `${config.targetVoiceName} (${config.targetVoiceId})`;
        if (config.hasApiKey) {
          apiKeyStatus.textContent = 'API Key Configured';
          apiKeyStatus.className = 'api-status configured';
        } else {
          apiKeyStatus.textContent = 'API Key Missing';
          apiKeyStatus.className = 'api-status missing';
          showStatus(
            'ElevenLabs API Key is not set in .env. Please configure ELEVENLABS_API_KEY to perform voice conversion.',
            'error'
          );
        }
      }
    } catch (err) {
      console.warn('Could not load server config:', err);
      targetVoiceDisplay.textContent = 'Adam (Default)';
    }
  }

  loadConfig();

  // Helper to format file sizes
  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper to show status message
  function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-box ${type}`;
    statusMessage.classList.remove('hidden');
  }

  function hideStatus() {
    statusMessage.classList.add('hidden');
    statusMessage.textContent = '';
  }

  // Handle file selection
  function handleFileSelected(file) {
    if (!file) return;

    // Validate that it looks like an audio file
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) {
      showStatus('Please select a valid audio file (e.g., .mp3, .wav, .m4a).', 'error');
      return;
    }

    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = `(${formatBytes(file.size)})`;
    fileInfo.classList.remove('hidden');
    dropArea.querySelector('.upload-placeholder').classList.add('hidden');

    // Create preview for original audio
    const originalUrl = URL.createObjectURL(file);
    originalAudioPlayer.src = originalUrl;
    originalAudioContainer.classList.remove('hidden');

    // Enable convert button
    convertBtn.disabled = false;
    hideStatus();
  }

  // File input change
  audioInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  // Drag and drop handlers
  ['dragenter', 'dragover'].forEach((eventName) => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropArea.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropArea.classList.remove('drag-over');
    });
  });

  dropArea.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      audioInput.files = e.dataTransfer.files;
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  // 2. Handle Voice Conversion
  convertBtn.addEventListener('click', async () => {
    if (!selectedFile) {
      showStatus('Please select an audio file first.', 'error');
      return;
    }

    // UI state: Loading
    convertBtn.disabled = true;
    btnSpinner.classList.remove('hidden');
    showStatus('Converting voice via ElevenLabs Speech-to-Speech API... please wait.', 'info');
    outputSection.classList.add('hidden');

    const formData = new FormData();
    formData.append('audio', selectedFile);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errorText = `Server returned status ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson.error) errorText = errJson.error;
        } catch (_) {
          const raw = await response.text();
          if (raw) errorText = raw;
        }
        throw new Error(errorText);
      }

      // Convert response into an audio Blob
      const audioBlob = await response.blob();

      // Revoke previous URL if any to free memory
      if (convertedAudioUrl) {
        URL.revokeObjectURL(convertedAudioUrl);
      }

      // Generate local object URL for the audio player and download button
      convertedAudioUrl = URL.createObjectURL(audioBlob);
      convertedAudioPlayer.src = convertedAudioUrl;
      downloadBtn.href = convertedAudioUrl;

      // Automatically construct download filename based on original
      const originalBaseName = selectedFile.name.replace(/\.[^/.]+$/, '');
      downloadBtn.download = `${originalBaseName}_converted.mp3`;

      // Show success
      showStatus('Voice conversion successful! You can listen or download below.', 'success');
      outputSection.classList.remove('hidden');

      // Scroll into view
      outputSection.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error('Voice conversion failed:', err);
      showStatus(`Voice conversion failed: ${err.message}`, 'error');
    } finally {
      convertBtn.disabled = false;
      btnSpinner.classList.add('hidden');
    }
  });
});
