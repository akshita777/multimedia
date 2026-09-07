import os
import mutagen

def analyze_audio(file_path):
    report = {}
    try:
        audio = mutagen.File(file_path)
        if audio is None:
            report['Error'] = "Could not read audio metadata or format is unsupported."
            return report

        report['File Name'] = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        report['File Size'] = f"{file_size / (1024 * 1024):.2f} MB"
        
        info = audio.info
        report['Channels'] = str(getattr(info, 'channels', 'Unknown'))
        report['Sampling Rate'] = f"{getattr(info, 'sample_rate', 'Unknown')} Hz"
        
        bitrate = getattr(info, 'bitrate', 'Unknown')
        if bitrate != 'Unknown':
            bitrate = f"{bitrate // 1000} kbps"
        report['Bit Rate'] = bitrate
        
        length = getattr(info, 'length', 0)
        report['Duration'] = f"{length:.2f} seconds"

        tags = getattr(audio, 'tags', {})
        if tags:
            metadata = {}
            for key, value in tags.items():
                metadata[key] = str(value)
            report['Metadata'] = metadata
            
    except Exception as e:
        report['Error'] = str(e)
    return report
