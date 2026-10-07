#!/usr/bin/env python3
"""
Multimedia Lab — Image Enhancer CLI Tool
Command-line interface for spatial filtering, histogram equalization,
sharpness enhancement, and image quality evaluation.
"""

import sys
import os
import argparse
import json
from enhancer import ImageEnhancer

def main():
    parser = argparse.ArgumentParser(description="Multimedia Image Enhancement CLI")
    parser.add_argument("--input", "-i", required=True, help="Path to input image")
    parser.add_argument("--output", "-o", default="enhanced_output.jpg", help="Path to save enhanced image")
    parser.add_argument("--preset", "-p", choices=["auto", "low_light", "crisp_detail", "hdr", "denoise_clean"],
                        help="Curated enhancement preset")
    parser.add_argument("--brightness", type=float, default=1.0, help="Brightness factor (1.0 = normal)")
    parser.add_argument("--contrast", type=float, default=1.0, help="Contrast factor (1.0 = normal)")
    parser.add_argument("--saturation", type=float, default=1.0, help="Saturation factor (1.0 = normal)")
    parser.add_argument("--sharpness", type=float, default=1.0, help="Sharpness factor (1.0 = normal)")
    parser.add_argument("--unsharp", action="store_true", help="Apply unsharp mask filter for edge definition")
    parser.add_argument("--equalize", action="store_true", help="Apply global luminance histogram equalization")
    parser.add_argument("--autocontrast", action="store_true", help="Apply auto-contrast stretch")
    parser.add_argument("--denoise", choices=["gaussian", "median"], help="Denoising filter type")
    parser.add_argument("--temp", type=float, default=0.0, help="Color temperature shift (-1.0 to 1.0)")
    parser.add_argument("--compare", action="store_true", help="Generate side-by-side Before/After comparison image")
    parser.add_argument("--json", action="store_true", help="Output metrics in raw JSON format")

    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"Error: Input file '{args.input}' does not exist.", file=sys.stderr)
        sys.exit(1)

    enhancer = ImageEnhancer(args.input)

    # 1. Apply preset if specified
    if args.preset:
        enhancer.apply_preset(args.preset)

    # 2. Apply granular adjustments
    if args.brightness != 1.0:
        enhancer.adjust_brightness(args.brightness)
    if args.contrast != 1.0:
        enhancer.adjust_contrast(args.contrast)
    if args.saturation != 1.0:
        enhancer.adjust_saturation(args.saturation)
    if args.sharpness != 1.0:
        enhancer.adjust_sharpness(args.sharpness)
    if args.temp != 0.0:
        enhancer.adjust_color_temperature(args.temp)
    if args.autocontrast:
        enhancer.auto_contrast()
    if args.equalize:
        enhancer.histogram_equalization()
    if args.unsharp:
        enhancer.unsharp_mask()
    if args.denoise == "gaussian":
        enhancer.denoise_gaussian()
    elif args.denoise == "median":
        enhancer.denoise_median()

    # Calculate metrics
    metrics = enhancer.calculate_metrics()

    # Save output
    if args.compare:
        comp_img = enhancer.create_comparison_image()
        comp_img.save(args.output, quality=95)
    else:
        enhancer.save(args.output, quality=95)

    if args.json:
        print(json.dumps(metrics, indent=4))
        return

    print("==================================================")
    print("      MULTIMEDIA LAB — IMAGE ENHANCER             ")
    print("==================================================")
    print(f"[*] Input File        : {args.input}")
    print(f"[*] Output Saved To   : {args.output}")
    print(f"[*] Comparison Mode   : {'Enabled (Side-by-Side)' if args.compare else 'Single Output'}")
    if args.preset:
        print(f"[*] Applied Preset    : {args.preset}")
    print("--------------------------------------------------")
    print("QUANTITATIVE QUALITY & ENHANCEMENT METRICS:")
    print(f" - Dimensions              : {metrics['Dimensions']}")
    print(f" - Peak SNR (PSNR)         : {metrics['PSNR_dB']} dB")
    print(f" - Mean Squared Error (MSE): {metrics['MSE']}")
    print(f" - Original Luminance Mean : {metrics['Original_Mean_Luminance']}")
    print(f" - Enhanced Luminance Mean : {metrics['Enhanced_Mean_Luminance']}")
    print(f" - Original Contrast StdDev: {metrics['Original_Contrast_StdDev']}")
    print(f" - Enhanced Contrast StdDev: {metrics['Enhanced_Contrast_StdDev']}")
    print("==================================================")
    print(f"[SUCCESS] Process complete! View your output at: {args.output}")

if __name__ == "__main__":
    main()
