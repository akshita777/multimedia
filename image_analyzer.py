import os
from PIL import Image
from PIL.ExifTags import TAGS

def analyze_image(file_path):
    report = {}
    try:
        with Image.open(file_path) as img:
            report['File Name'] = os.path.basename(file_path)
            report['File Size'] = f"{os.path.getsize(file_path) / 1024:.2f} KB"
            report['File Format'] = img.format
            width, height = img.size
            report['Width'] = f"{width} px"
            report['Height'] = f"{height} px"
            report['Resolution'] = str(img.info.get('dpi', 'Unknown'))
            report['Color Mode'] = img.mode

            exif_data = img.getexif()
            if exif_data:
                exif_dict = {}
                for tag_id, value in exif_data.items():
                    tag = TAGS.get(tag_id, tag_id)
                    if tag in ('Make', 'Model', 'DateTime', 'Orientation', 'Software'):
                        label = tag
                        if tag == 'Make': label = 'Camera Make'
                        elif tag == 'Model': label = 'Camera Model'
                        elif tag == 'DateTime': label = 'Date Taken'
                        exif_dict[label] = str(value)
                report['EXIF Metadata'] = exif_dict
    except Exception as e:
        report['Error'] = str(e)
    return report
