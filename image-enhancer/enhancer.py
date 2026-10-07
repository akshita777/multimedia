"""
Multimedia Image Enhancement Engine
Implements spatial filtering, histogram equalization, unsharp masking,
tonal corrections, and quantitative quality assessment (PSNR, MSE).
"""

import os
import math
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

class ImageEnhancer:
    def __init__(self, image_path_or_pil):
        if isinstance(image_path_or_pil, str):
            self.original = Image.open(image_path_or_pil).convert("RGB")
            self.file_path = image_path_or_pil
        elif isinstance(image_path_or_pil, Image.Image):
            self.original = image_path_or_pil.convert("RGB")
            self.file_path = None
        else:
            raise ValueError("Input must be a file path or PIL Image object.")
        
        self.enhanced = self.original.copy()

    def reset(self):
        """Reset enhanced image back to original."""
        self.enhanced = self.original.copy()
        return self

    def adjust_brightness(self, factor=1.0):
        """
        Adjust image brightness.
        factor: 1.0 = original, <1.0 = darker, >1.0 = brighter
        """
        enhancer = ImageEnhance.Brightness(self.enhanced)
        self.enhanced = enhancer.enhance(factor)
        return self

    def adjust_contrast(self, factor=1.0):
        """
        Adjust image contrast.
        factor: 1.0 = original, <1.0 = lower contrast, >1.0 = higher contrast
        """
        enhancer = ImageEnhance.Contrast(self.enhanced)
        self.enhanced = enhancer.enhance(factor)
        return self

    def adjust_saturation(self, factor=1.0):
        """
        Adjust color saturation.
        factor: 0.0 = black & white, 1.0 = original, >1.0 = vibrant
        """
        enhancer = ImageEnhance.Color(self.enhanced)
        self.enhanced = enhancer.enhance(factor)
        return self

    def adjust_sharpness(self, factor=1.0):
        """
        Adjust image sharpness.
        factor: 1.0 = original, >1.0 = sharper
        """
        enhancer = ImageEnhance.Sharpness(self.enhanced)
        self.enhanced = enhancer.enhance(factor)
        return self

    def unsharp_mask(self, radius=2, percent=150, threshold=3):
        """
        Unsharp masking algorithm for high-frequency edge crispness.
        Formula: Enhanced = Original + amount * (Original - Blurred)
        """
        self.enhanced = self.enhanced.filter(
            ImageFilter.UnsharpMask(radius=radius, percent=percent, threshold=threshold)
        )
        return self

    def denoise_gaussian(self, radius=1):
        """
        Gaussian smoothing filter for noise reduction.
        """
        self.enhanced = self.enhanced.filter(ImageFilter.GaussianBlur(radius=radius))
        return self

    def denoise_median(self, size=3):
        """
        Median filter - highly effective against impulse/salt-and-pepper noise.
        """
        self.enhanced = self.enhanced.filter(ImageFilter.MedianFilter(size=size))
        return self

    def histogram_equalization(self):
        """
        Global Histogram Equalization in YCbCr/Luminance space.
        Enhances contrast by flattening the intensity histogram without distorting hue.
        """
        ycbcr = self.enhanced.convert("YCbCr")
        y, cb, cr = ycbcr.split()

        # Equalize only the luminance (Y) channel
        y_eq = ImageOps.equalize(y)
        self.enhanced = Image.merge("YCbCr", (y_eq, cb, cr)).convert("RGB")
        return self

    def auto_contrast(self, cutoff=1):
        """
        Auto contrast stretch (normalizes darkest and brightest pixels).
        cutoff: percentage of pixels to ignore at extremes.
        """
        self.enhanced = ImageOps.autocontrast(self.enhanced, cutoff=cutoff)
        return self

    def adjust_color_temperature(self, kelvin_factor=0.0):
        """
        Adjust color temperature:
        kelvin_factor > 0: Warm (boosts red/yellow)
        kelvin_factor < 0: Cool (boosts blue)
        """
        if kelvin_factor == 0.0:
            return self

        r, g, b = self.enhanced.split()
        r_arr = np.array(r, dtype=np.float32)
        g_arr = np.array(g, dtype=np.float32)
        b_arr = np.array(b, dtype=np.float32)

        if kelvin_factor > 0:
            # Warm tint
            r_arr = np.clip(r_arr * (1.0 + kelvin_factor * 0.2), 0, 255)
            b_arr = np.clip(b_arr * (1.0 - kelvin_factor * 0.15), 0, 255)
        else:
            # Cool tint
            kf = abs(kelvin_factor)
            b_arr = np.clip(b_arr * (1.0 + kf * 0.2), 0, 255)
            r_arr = np.clip(r_arr * (1.0 - kf * 0.15), 0, 255)

        r_out = Image.fromarray(r_arr.astype(np.uint8))
        g_out = Image.fromarray(g_arr.astype(np.uint8))
        b_out = Image.fromarray(b_arr.astype(np.uint8))

        self.enhanced = Image.merge("RGB", (r_out, g_out, b_out))
        return self

    def apply_preset(self, preset_name):
        """
        Apply a curated multi-stage enhancement preset.
        Options: 'auto', 'low_light', 'crisp_detail', 'hdr', 'denoise_clean'
        """
        name = preset_name.lower().strip()
        if name == 'auto':
            self.auto_contrast(cutoff=1)
            self.adjust_contrast(1.15)
            self.adjust_saturation(1.1)
            self.unsharp_mask(radius=1.5, percent=120, threshold=2)
        elif name == 'low_light':
            self.adjust_brightness(1.35)
            self.adjust_contrast(1.2)
            self.adjust_saturation(1.15)
            self.unsharp_mask(radius=1.2, percent=100, threshold=3)
        elif name == 'crisp_detail':
            self.unsharp_mask(radius=2.0, percent=180, threshold=1)
            self.adjust_contrast(1.1)
        elif name == 'hdr':
            self.histogram_equalization()
            self.adjust_contrast(1.15)
            self.adjust_saturation(1.25)
            self.unsharp_mask(radius=1.5, percent=130, threshold=2)
        elif name == 'denoise_clean':
            self.denoise_median(size=3)
            self.adjust_sharpness(1.3)
            self.adjust_contrast(1.05)
        else:
            raise ValueError(f"Unknown preset '{preset_name}'. Available: auto, low_light, crisp_detail, hdr, denoise_clean")
        return self

    def calculate_metrics(self):
        """
        Calculate quantitative image quality metrics:
        - MSE (Mean Squared Error)
        - PSNR (Peak Signal to Noise Ratio)
        - Luminance Mean & Contrast Std Dev
        """
        orig_arr = np.array(self.original, dtype=np.float64)
        enh_arr = np.array(self.enhanced, dtype=np.float64)

        mse = np.mean((orig_arr - enh_arr) ** 2)

        if mse == 0:
            psnr = float('inf')
        else:
            max_pixel = 255.0
            psnr = 20 * math.log10(max_pixel / math.sqrt(mse))

        # Dynamic Range / Luminance Metrics
        orig_lum = 0.299 * orig_arr[:, :, 0] + 0.587 * orig_arr[:, :, 1] + 0.114 * orig_arr[:, :, 2]
        enh_lum = 0.299 * enh_arr[:, :, 0] + 0.587 * enh_arr[:, :, 1] + 0.114 * enh_arr[:, :, 2]

        return {
            "MSE": round(float(mse), 2),
            "PSNR_dB": round(float(psnr), 2) if psnr != float('inf') else "Inf (Identical)",
            "Original_Mean_Luminance": round(float(np.mean(orig_lum)), 2),
            "Enhanced_Mean_Luminance": round(float(np.mean(enh_lum)), 2),
            "Original_Contrast_StdDev": round(float(np.std(orig_lum)), 2),
            "Enhanced_Contrast_StdDev": round(float(np.std(enh_lum)), 2),
            "Dimensions": f"{self.original.width}x{self.original.height}"
        }

    def create_comparison_image(self):
        """
        Generate a side-by-side Before / After comparison canvas with titles.
        """
        w, h = self.original.size
        border = 20
        total_w = w * 2 + border * 3
        total_h = h + border * 2

        comp = Image.new("RGB", (total_w, total_h), (24, 24, 27))
        comp.paste(self.original, (border, border))
        comp.paste(self.enhanced, (w + border * 2, border))
        return comp

    def save(self, output_path, quality=95):
        """Save enhanced image to file."""
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        self.enhanced.save(output_path, quality=quality)
        return output_path
