#!/usr/bin/env python3
"""
Lightweight Web Server for Image Enhancement Studio
Built with Python standard library (http.server) - no extra dependencies needed!
"""

import os
import sys
import json
import base64
import io
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
from PIL import Image

from enhancer import ImageEnhancer

PORT = 3002
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")

class ImageEnhanceHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/sample":
            sample_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../samples/sample.jpg")
            if os.path.exists(sample_path):
                self.send_response(200)
                self.send_header("Content-Type", "image/jpeg")
                self.end_headers()
                with open(sample_path, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404, "Sample image not found")
            return
        
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/enhance":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length).decode("utf-8")
                req_data = json.loads(body)

                # Decode base64 image
                image_b64 = req_data.get("image")
                if not image_b64:
                    self.send_error(400, "Missing image data")
                    return

                if "," in image_b64:
                    image_b64 = image_b64.split(",", 1)[1]

                img_bytes = base64.b64decode(image_b64)
                pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

                enhancer = ImageEnhancer(pil_img)

                # Apply Preset if given
                preset = req_data.get("preset")
                if preset:
                    enhancer.apply_preset(preset)

                # Apply granular controls
                brightness = float(req_data.get("brightness", 1.0))
                contrast = float(req_data.get("contrast", 1.0))
                saturation = float(req_data.get("saturation", 1.0))
                sharpness = float(req_data.get("sharpness", 1.0))
                temp = float(req_data.get("temp", 0.0))

                if brightness != 1.0:
                    enhancer.adjust_brightness(brightness)
                if contrast != 1.0:
                    enhancer.adjust_contrast(contrast)
                if saturation != 1.0:
                    enhancer.adjust_saturation(saturation)
                if sharpness != 1.0:
                    enhancer.adjust_sharpness(sharpness)
                if temp != 0.0:
                    enhancer.adjust_color_temperature(temp)

                if req_data.get("unsharp"):
                    enhancer.unsharp_mask()
                if req_data.get("equalize"):
                    enhancer.histogram_equalization()
                if req_data.get("autocontrast"):
                    enhancer.auto_contrast()
                if req_data.get("denoise") == "gaussian":
                    enhancer.denoise_gaussian()
                elif req_data.get("denoise") == "median":
                    enhancer.denoise_median()

                # Get metrics
                metrics = enhancer.calculate_metrics()

                # Encode enhanced image back to base64 JPEG
                out_buffer = io.BytesIO()
                enhancer.enhanced.save(out_buffer, format="JPEG", quality=92)
                enhanced_b64 = "data:image/jpeg;base64," + base64.b64encode(out_buffer.getvalue()).decode("utf-8")

                resp_payload = {
                    "success": True,
                    "enhancedImage": enhanced_b64,
                    "metrics": metrics
                }

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(resp_payload).encode("utf-8"))

            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        self.send_error(404, "Endpoint not found")

def main():
    server_address = ("", PORT)
    httpd = HTTPServer(server_address, ImageEnhanceHandler)
    print("=======================================================")
    print(f"✨ Image Enhancement Studio running at http://localhost:{PORT}")
    print("Algorithms: Histogram Equalization, Unsharp Mask, CLAHE, Denoising")
    print("=======================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")

if __name__ == "__main__":
    main()
