# Image Enhancement & Quality Assessment Module

Comprehensive digital image processing tool implementing spatial filtering, histogram equalization, unsharp masking, tonal correction, and quantitative fidelity evaluation (**PSNR**, **MSE**).

Provides both an interactive **Web Studio** (with live before/after split slider comparison) and a full-featured **Python CLI**.

---

## 🚀 Features

* **Spatial Filtering & Edge Sharpening:**
  * **Unsharp Masking:** High-frequency edge definition ($I_{\text{sharp}} = I + \alpha \cdot (I - I_{\text{blur}})$)
  * **Median Filter:** Effective elimination of salt-and-pepper / impulse noise
  * **Gaussian Blur:** Noise reduction and smoothing
* **Histogram Processing:**
  * **Global Histogram Equalization (YCbCr):** Spreads luminance dynamic range without altering color hue
  * **Auto-Contrast Stretching:** Normalized percentiles to maximize dynamic range
* **Tonal & Color Adjustments:**
  * Brightness, Contrast, Saturation, Sharpness, and Color Temperature (Warm/Cool)
* **Quantitative Quality Assessment:**
  * **PSNR (Peak Signal-to-Noise Ratio):** In decibels (dB)
  * **MSE (Mean Squared Error):** Pixel error deviation
  * **Luminance & Standard Deviation:** Pre and post contrast distribution
* **Interactive Web Studio:**
  * Real-time before/after draggable split comparison slider
  * Side-by-side mode
  * Instant presets: *Auto AI*, *Low Light*, *Crisp Detail*, *Vibrant HDR*, *Denoise Clean*
  * High-res output download

---

## 📁 Module Structure

```
image-enhancer/
├── enhancer.py        # Core image enhancement engine (Pillow + NumPy)
├── cli.py             # Python command-line utility
├── server.py          # Lightweight HTTP server (no external frameworks required)
├── README.md          # Module documentation
└── web/               # Web Studio Interface
    ├── index.html     # Studio UI
    ├── style.css      # Modern responsive styling
    └── app.js         # Split slider & interactive client logic
```

---

## 🛠️ Quick Start

### 1. Web Studio

```bash
# Navigate to module
cd image-enhancer

# Start local server (runs on port 3002)
python server.py
```

Open `http://localhost:3002` in your browser.

### 2. Python CLI

#### Quick Auto Enhancement:
```bash
python cli.py --input ../samples/sample.jpg --output enhanced.jpg --preset auto
```

#### Side-by-Side Comparison Canvas:
```bash
python cli.py --input ../samples/sample.jpg --output comparison.jpg --preset hdr --compare
```

#### Custom Parameter Tuning:
```bash
python cli.py \
  --input ../samples/sample.jpg \
  --output custom.jpg \
  --brightness 1.2 \
  --contrast 1.3 \
  --sharpness 1.6 \
  --unsharp \
  --equalize
```

#### Output Metrics in JSON:
```bash
python cli.py --input ../samples/sample.jpg --preset auto --json
```

---

## 📊 Mathematical Foundations

1. **Mean Squared Error (MSE):**
   $$\text{MSE} = \frac{1}{M \cdot N} \sum_{i=0}^{M-1} \sum_{j=0}^{N-1} [I(i, j) - K(i, j)]^2$$

2. **Peak Signal-to-Noise Ratio (PSNR):**
   $$\text{PSNR} = 10 \cdot \log_{10}\left(\frac{\text{MAX}_I^2}{\text{MSE}}\right) = 20 \cdot \log_{10}\left(\frac{255}{\sqrt{\text{MSE}}}\right)$$
