import os

def check_file_exists(file_path):
    return os.path.exists(file_path)

def get_file_size(file_path):
    return os.path.getsize(file_path)

def get_file_extension(file_path):
    _, ext = os.path.splitext(file_path)
    return ext.lower()

def identify_file_type(file_path):
    ext = get_file_extension(file_path)
    
    image_exts = ['.jpg', '.jpeg', '.png', '.tiff', '.webp', '.bmp']
    audio_exts = ['.mp3', '.wav', '.flac', '.ogg', '.m4a']
    video_exts = ['.mp4', '.avi', '.mkv', '.mov', '.wmv']
    
    if ext in image_exts:
        return "IMAGE"
    elif ext in audio_exts:
        return "AUDIO"
    elif ext in video_exts:
        return "VIDEO"
    else:
        return "UNKNOWN"
