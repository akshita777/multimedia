import sys
from file_utils import check_file_exists, identify_file_type
from image_analyzer import analyze_image
from audio_analyzer import analyze_audio
from video_analyzer import analyze_video
from report_generator import generate_report

def main():
    if len(sys.argv) < 2:
        print("Usage: python main.py <path_to_media_file>")
        return

    file_path = sys.argv[1]
    
    if not check_file_exists(file_path):
        print(f"Error: File {file_path} does not exist.")
        return

    file_type = identify_file_type(file_path)
    
    report_data = {
        "File Type Identified": file_type
    }
    
    if file_type == "IMAGE":
        report_data.update(analyze_image(file_path))
    elif file_type == "AUDIO":
        report_data.update(analyze_audio(file_path))
    elif file_type == "VIDEO":
        report_data.update(analyze_video(file_path))
    else:
        print("Error: Unsupported file format.")
        return

    generate_report(report_data, output_dir="reports")

if __name__ == "__main__":
    main()
