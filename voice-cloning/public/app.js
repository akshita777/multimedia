document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const statusIndicator = document.getElementById('statusIndicator');
  const apiStatusText = document.getElementById('apiStatusText');
  const dropArea = document.getElementById('dropArea');
  const audioInput = document.getElementById('audioInput');
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');
  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const originalAudioContainer = document.getElementById('originalAudioContainer');
  const originalAudioPlayer = document.getElementById('originalAudioPlayer');
  const useSampleBtn = document.getElementById('useSampleBtn');

  const voiceNameInput = document.getElementById('voiceNameInput');
  const voiceDescInput = document.getElementById('voiceDescInput');
  const cloneBtn = document.getElementById('cloneBtn');
  const cloneSpinner = document.getElementById('cloneSpinner');
  const cloneSuccessCard = document.getElementById('cloneSuccessCard');
  const activeVoiceIdSpan = document.getElementById('activeVoiceId');
  const activeVoiceNameSpan = document.getElementById('activeVoiceName');

  const ttsTextInput = document.getElementById('ttsTextInput');
  const generateBtn = document.getElementById('generateBtn');
  const genSpinner = document.getElementById('genSpinner');
  const resultsSection = document.getElementById('resultsSection');
  const resultAudioPlayer = document.getElementById('resultAudioPlayer');
  const downloadBtn = document.getElementById('downloadBtn');
  const alertBox = document.getElementById('alertBox');
  const voicesList = document.getElementById('voicesList');

  let selectedFile = null;
  let activeVoiceId = null;

  // Init
  init();

  async function init() {
    await checkConfig();
    await loadVoices();
    setupEventListeners();
  }

  async function checkConfig() {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.hasApiKey) {
        statusIndicator.className = 'status-indicator online';
        apiStatusText.textContent = 'ElevenLabs Instant Voice Cloning API: Active';
      } else {
        statusIndicator.className = 'status-indicator online';
        apiStatusText.textContent = 'Voice Cloning Engine: Ready (Demo / Simulation Mode)';
      }
    } catch (e) {
      statusIndicator.className = 'status-indicator';
      apiStatusText.textContent = 'Backend offline or error checking status';
    }
  }

  async function loadVoices() {
    try {
      const res = await fetch('/api/voices');
      const data = await res.json();
      voicesList.innerHTML = '';
      if (!data.voices || data.voices.length === 0) {
        voicesList.innerHTML = '<div class="voice-item-placeholder">No custom cloned voices yet. Clone one above!</div>';
        return;
      }

      data.voices.slice(0, 8).forEach(v => {
        const chip = document.createElement('div');
        chip.className = `voice-chip ${v.voice_id === activeVoiceId ? 'selected' : ''}`;
        chip.innerHTML = `
          <strong>${escapeHtml(v.name)}</strong>
          <span>${v.simulated ? 'Demo Profile' : 'ElevenLabs Voice'}</span>
        `;
        chip.addEventListener('click', () => {
          setActiveVoice(v.voice_id, v.name);
        });
        voicesList.appendChild(chip);
      });
    } catch (e) {
      voicesList.innerHTML = '<div class="voice-item-placeholder">Unable to load voice library.</div>';
    }
  }

  function setupEventListeners() {
    // Drop area drag & drop
    ['dragenter', 'dragover'].forEach(name => {
      dropArea.addEventListener(name, (e) => {
        e.preventDefault();
        dropArea.style.borderColor = 'var(--primary)';
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropArea.addEventListener(name, (e) => {
        e.preventDefault();
        dropArea.style.borderColor = '#cbd5e1';
      });
    });

    dropArea.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    audioInput.addEventListener('change', () => {
      if (audioInput.files && audioInput.files[0]) {
        handleFileSelect(audioInput.files[0]);
      }
    });

    // Bundled sample loader
    useSampleBtn.addEventListener('click', async () => {
      try {
        useSampleBtn.disabled = true;
        useSampleBtn.textContent = '⏳ Loading sample...';
        const resp = await fetch('/api/sample-audio');
        if (!resp.ok) throw new Error('Sample not found');
        const blob = await resp.blob();
        const file = new File([blob], 'speech_sample.mp3', { type: 'audio/mpeg' });
        handleFileSelect(file);
        voiceNameInput.value = 'Demo Voice (Sample)';
        showAlert('Bundled sample audio loaded successfully!', 'success');
      } catch (err) {
        showAlert('Could not load sample audio: ' + err.message, 'error');
      } finally {
        useSampleBtn.disabled = false;
        useSampleBtn.textContent = '🎵 Use Bundled Sample (speech_sample.mp3)';
      }
    });

    // Clone button click
    cloneBtn.addEventListener('click', handleCloneVoice);

    // Text prompts chips
    document.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        ttsTextInput.value = btn.dataset.text;
      });
    });

    // Generate speech button
    generateBtn.addEventListener('click', handleGenerateSpeech);
  }

  function handleFileSelect(file) {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)) {
      showAlert('Please choose an audio file (.mp3, .wav, etc.)', 'error');
      return;
    }

    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    uploadPlaceholder.classList.add('hidden');
    fileInfo.classList.remove('hidden');

    const fileUrl = URL.createObjectURL(file);
    originalAudioPlayer.src = fileUrl;
    originalAudioContainer.classList.remove('hidden');

    cloneBtn.disabled = false;
    hideAlert();
  }

  async function handleCloneVoice() {
    if (!selectedFile) {
      showAlert('Please upload or select an audio sample first.', 'error');
      return;
    }

    const name = voiceNameInput.value.trim() || 'Custom Persona';
    const description = voiceDescInput.value.trim() || '';

    setCloneLoading(true);
    hideAlert();

    const formData = new FormData();
    formData.append('sample', selectedFile);
    formData.append('name', name);
    formData.append('description', description);

    try {
      const resp = await fetch('/api/clone', {
        method: 'POST',
        body: formData
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to clone voice.');
      }

      setActiveVoice(data.voice_id, data.name);
      showAlert(data.message || 'Voice profile successfully created!', 'success');
      await loadVoices();
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      setCloneLoading(false);
    }
  }

  function setActiveVoice(voiceId, voiceName) {
    activeVoiceId = voiceId;
    activeVoiceIdSpan.textContent = voiceId;
    activeVoiceNameSpan.textContent = voiceName;
    cloneSuccessCard.classList.remove('hidden');
    generateBtn.disabled = false;

    // highlight in voice list
    document.querySelectorAll('.voice-chip').forEach(c => {
      if (c.querySelector('strong').textContent === voiceName) {
        c.classList.add('selected');
      } else {
        c.classList.remove('selected');
      }
    });
  }

  async function handleGenerateSpeech() {
    if (!activeVoiceId) {
      showAlert('Please clone or select a voice first.', 'error');
      return;
    }

    const text = ttsTextInput.value.trim();
    if (!text) {
      showAlert('Please enter text to synthesize.', 'error');
      return;
    }

    setGenLoading(true);
    hideAlert();

    try {
      const resp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: activeVoiceId,
          text: text
        })
      });

      if (!resp.ok) {
        let errMessage = 'Speech generation failed.';
        try {
          const errData = await resp.json();
          errMessage = errData.error || errMessage;
        } catch (_) {}
        throw new Error(errMessage);
      }

      const audioBlob = await resp.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      resultAudioPlayer.src = audioUrl;
      downloadBtn.href = audioUrl;
      downloadBtn.download = `cloned_speech_${activeVoiceNameSpan.textContent.replace(/\s+/g, '_')}.mp3`;
      resultsSection.classList.remove('hidden');
      resultAudioPlayer.play().catch(() => {});

      showAlert('Speech generated successfully in cloned voice timbre!', 'success');
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      setGenLoading(false);
    }
  }

  function setCloneLoading(loading) {
    cloneBtn.disabled = loading;
    if (loading) {
      cloneBtn.querySelector('.btn-text').textContent = 'Extracting timbre & cloning...';
      cloneSpinner.classList.remove('hidden');
    } else {
      cloneBtn.querySelector('.btn-text').textContent = '🧬 Clone This Voice';
      cloneSpinner.classList.add('hidden');
    }
  }

  function setGenLoading(loading) {
    generateBtn.disabled = loading;
    if (loading) {
      generateBtn.querySelector('.btn-text').textContent = 'Synthesizing cloned speech...';
      genSpinner.classList.remove('hidden');
    } else {
      generateBtn.querySelector('.btn-text').textContent = '🔊 Generate Speech with Cloned Voice';
      genSpinner.classList.add('hidden');
    }
  }

  function showAlert(msg, type = 'error') {
    alertBox.textContent = msg;
    alertBox.className = `alert-box ${type}`;
    alertBox.classList.remove('hidden');
  }

  function hideAlert() {
    alertBox.classList.add('hidden');
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
});
