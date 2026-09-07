import json
import os

def generate_report(report_data, output_dir="reports"):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    output_file = os.path.join(output_dir, "report.json")
    
    # Optionally print to console
    print("================================")
    print("CONSOLIDATED MULTIMEDIA REPORT")
    print("================================")
    print(json.dumps(report_data, indent=4))
    
    with open(output_file, 'w') as f:
        json.dump(report_data, f, indent=4)
        
    print(f"\nReport saved to {output_file}")
