document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const loadSampleBtn = document.getElementById('loadSampleBtn');
  const imageUpload = document.getElementById('imageUpload');
  const applyBtn = document.getElementById('applyBtn');
  const resetBtn = document.getElementById('resetBtn');
  const spinner = document.getElementById('spinner');
  const downloadBtn = document.getElementById('downloadBtn');

  // Sliders
  const brightnessSlider = document.getElementById('brightnessSlider');
  const contrastSlider = document.getElementById('contrastSlider');
  const saturationSlider = document.getElementById('saturationSlider');
  const sharpnessSlider = document.getElementById('sharpnessSlider');
  const tempSlider = document.getElementById('tempSlider');

  const brightnessVal = document.getElementById('brightnessVal');
  const contrastVal = document.getElementById('contrastVal');
  const saturationVal = document.getElementById('saturationVal');
  const sharpnessVal = document.getElementById('sharpnessVal');
  const tempVal = document.getElementById('tempVal');

  // Checkboxes
  const chkEqualize = document.getElementById('chkEqualize');
  const chkUnsharp = document.getElementById('chkUnsharp');
  const chkAutoContrast = document.getElementById('chkAutoContrast');
  const chkMedianDenoise = document.getElementById('chkMedianDenoise');

  // Viewer elements
  const splitViewer = document.getElementById('splitViewer');
  const origWrapper = document.getElementById('origWrapper');
  const sliderHandle = document.getElementById('sliderHandle');
  const originalImg = document.getElementById('originalImg');
  const enhancedImg = document.getElementById('enhancedImg');

  const sideViewer = document.getElementById('sideViewer');
  const sideOrigImg = document.getElementById('sideOrigImg');
  const sideEnhImg = document.getElementById('sideEnhImg');

  const modeSplit = document.getElementById('modeSplit');
  const modeSideBySide = document.getElementById('modeSideBySide');

  // Metrics
  const metricPsnr = document.getElementById('metricPsnr');
  const metricMse = document.getElementById('metricMse');
  const metricLum = document.getElementById('metricLum');
  const metricContrast = document.getElementById('metricContrast');

  let currentImageBase64 = null;
  let activePreset = 'auto';
  let isDragging = false;

  init();

  async function init() {
    setupSliders();
    setupSplitDrag();
    setupModes();
    setupPresets();

    // Auto-load sample image on startup
    await loadSample();
  }

  async function loadSample() {
    try {
      const resp = await fetch('/api/sample');
      if (!resp.ok) throw new Error('Sample image not found');
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        applyEnhancement();
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.warn('Could not auto-load sample:', e);
    }
  }

  function setImage(dataUrl) {
    currentImageBase64 = dataUrl;
    originalImg.src = dataUrl;
    sideOrigImg.src = dataUrl;
    enhancedImg.src = dataUrl;
    sideEnhImg.src = dataUrl;
  }

  function setupSliders() {
    brightnessSlider.addEventListener('input', () => {
      brightnessVal.textContent = `${parseFloat(brightnessSlider.value).toFixed(2)}x`;
      clearPresetHighlight();
    });
    contrastSlider.addEventListener('input', () => {
      contrastVal.textContent = `${parseFloat(contrastSlider.value).toFixed(2)}x`;
      clearPresetHighlight();
    });
    saturationSlider.addEventListener('input', () => {
      saturationVal.textContent = `${parseFloat(saturationSlider.value).toFixed(2)}x`;
      clearPresetHighlight();
    });
    sharpnessSlider.addEventListener('input', () => {
      sharpnessVal.textContent = `${parseFloat(sharpnessSlider.value).toFixed(2)}x`;
      clearPresetHighlight();
    });
    tempSlider.addEventListener('input', () => {
      tempVal.textContent = `${parseFloat(tempSlider.value).toFixed(2)}`;
      clearPresetHighlight();
    });

    [chkEqualize, chkUnsharp, chkAutoContrast, chkMedianDenoise].forEach(el => {
      el.addEventListener('change', clearPresetHighlight);
    });

    applyBtn.addEventListener('click', applyEnhancement);
    resetBtn.addEventListener('click', resetControls);

    loadSampleBtn.addEventListener('click', loadSample);
    imageUpload.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
          setImage(ev.target.result);
          applyEnhancement();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  function setupPresets() {
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activePreset = btn.dataset.preset;
        applyEnhancement();
      });
    });
  }

  function clearPresetHighlight() {
    activePreset = null;
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  }

  function resetControls() {
    brightnessSlider.value = 1.0; brightnessVal.textContent = '1.00x';
    contrastSlider.value = 1.0; contrastVal.textContent = '1.00x';
    saturationSlider.value = 1.0; saturationVal.textContent = '1.00x';
    sharpnessSlider.value = 1.0; sharpnessVal.textContent = '1.00x';
    tempSlider.value = 0.0; tempVal.textContent = '0.00';

    chkEqualize.checked = false;
    chkUnsharp.checked = false;
    chkAutoContrast.checked = false;
    chkMedianDenoise.checked = false;

    activePreset = 'auto';
    const autoBtn = document.querySelector('[data-preset="auto"]');
    if (autoBtn) autoBtn.classList.add('active');

    applyEnhancement();
  }

  async function applyEnhancement() {
    if (!currentImageBase64) return;

    setLoading(true);

    const payload = {
      image: currentImageBase64,
      preset: activePreset,
      brightness: parseFloat(brightnessSlider.value),
      contrast: parseFloat(contrastSlider.value),
      saturation: parseFloat(saturationSlider.value),
      sharpness: parseFloat(sharpnessSlider.value),
      temp: parseFloat(tempSlider.value),
      equalize: chkEqualize.checked,
      unsharp: chkUnsharp.checked,
      autocontrast: chkAutoContrast.checked,
      denoise: chkMedianDenoise.checked ? 'median' : null
    };

    try {
      const resp = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Enhancement failed');

      // Update images
      enhancedImg.src = data.enhancedImage;
      sideEnhImg.src = data.enhancedImage;

      downloadBtn.href = data.enhancedImage;
      downloadBtn.classList.remove('disabled');

      // Update metrics
      const m = data.metrics;
      metricPsnr.textContent = `${m.PSNR_dB} dB`;
      metricMse.textContent = `${m.MSE}`;
      metricLum.textContent = `${m.Original_Mean_Luminance} → ${m.Enhanced_Mean_Luminance}`;
      metricContrast.textContent = `σ: ${m.Original_Contrast_StdDev} → ${m.Enhanced_Contrast_StdDev}`;

    } catch (err) {
      alert('Error applying enhancement: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function setLoading(loading) {
    applyBtn.disabled = loading;
    if (loading) {
      spinner.classList.remove('hidden');
      applyBtn.querySelector('.btn-text').textContent = 'Processing...';
    } else {
      spinner.classList.add('hidden');
      applyBtn.querySelector('.btn-text').textContent = '⚡ Apply Enhancement';
    }
  }

  // Interactive Split Slider drag handling
  function setupSplitDrag() {
    const updatePosition = (clientX) => {
      const rect = splitViewer.getBoundingClientRect();
      let x = clientX - rect.left;
      x = Math.max(0, Math.min(x, rect.width));
      const pct = (x / rect.width) * 100;

      origWrapper.style.width = `${pct}%`;
      sliderHandle.style.left = `${pct}%`;
    };

    splitViewer.addEventListener('mousedown', (e) => {
      isDragging = true;
      updatePosition(e.clientX);
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch support
    splitViewer.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        updatePosition(e.touches[0].clientX);
      }
    });
  }

  function setupModes() {
    modeSplit.addEventListener('click', () => {
      modeSplit.classList.add('active');
      modeSideBySide.classList.remove('active');
      splitViewer.classList.remove('hidden');
      sideViewer.classList.add('hidden');
    });

    modeSideBySide.addEventListener('click', () => {
      modeSideBySide.classList.add('active');
      modeSplit.classList.remove('active');
      splitViewer.classList.add('hidden');
      sideViewer.classList.remove('hidden');
    });
  }
});
