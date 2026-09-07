import os
import subprocess
import json

def get_ffprobe_data(file_path):
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        file_path
    ]
    try:
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return json.loads(result.stdout)
    except Exception as e:
        return None

def analyze_video(file_path):
    report = {}
    data = get_ffprobe_data(file_path)
    if not data:
        report['Error'] = "Could not retrieve video data."
        return report

    format_info = data.get('format', {})
    streams = data.get('streams', [])

    report['File Name'] = os.path.basename(file_path)
    file_size = os.path.getsize(file_path)
    report['File Size'] = f"{file_size / (1024 * 1024):.2f} MB"
    report['Container'] = format_info.get('format_long_name', format_info.get('format_name', 'Unknown'))
    duration = float(format_info.get('duration', 0))
    report['Duration'] = f"{duration:.2f} seconds"

    video_stream = next((s for s in streams if s.get('codec_type') == 'video'), {})
    audio_stream = next((s for s in streams if s.get('codec_type') == 'audio'), {})

    if video_stream:
        v_report = {}
        v_report['Resolution'] = f"{video_stream.get('width', 'Unknown')}x{video_stream.get('height', 'Unknown')}"
        v_report['Frame Rate'] = video_stream.get('r_frame_rate', 'Unknown')
        bit_rate = video_stream.get('bit_rate', 'Unknown')
        if bit_rate != 'Unknown':
            bit_rate = f"{int(bit_rate) // 1000} kbps"
        v_report['Bit Rate'] = bit_rate
        v_report['Codec'] = video_stream.get('codec_name', 'Unknown')
        report['Video'] = v_report

    if audio_stream:
        a_report = {}
        a_report['Codec'] = audio_stream.get('codec_name', 'Unknown')
        a_report['Channels'] = str(audio_stream.get('channels', 'Unknown'))
        a_report['Sampling Rate'] = f"{audio_stream.get('sample_rate', 'Unknown')} Hz"
        a_bit_rate = audio_stream.get('bit_rate', 'Unknown')
        if a_bit_rate != 'Unknown':
            a_bit_rate = f"{int(a_bit_rate) // 1000} kbps"
        a_report['Bit Rate'] = a_bit_rate
        report['Audio'] = a_report

    tags = format_info.get('tags', {})
    if tags:
        report['Metadata'] = tags

    return report
