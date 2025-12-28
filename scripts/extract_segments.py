"""
Extract segment speed limits from modifiedscripts.js and create JSON files
"""
import json
import re

# Read the JavaScript file
with open('modifiedscripts.js', 'r') as f:
    content = f.read()

# Extract getFastSegmentBasedLimits function (lines 425-662)
fast_start = content.find('function getFastSegmentBasedLimits(){')
fast_end = content.find('};', fast_start) + 2
fast_content = content[fast_start:fast_end]

# Extract getSegmentBasedSpeedLimits function (lines 667-1794)
slow_start = content.find('function getSegmentBasedSpeedLimits() {')
slow_end = content.find('\n}', slow_start) + 2
# Find the correct end - look for the closing of the return array
slow_sections = content[slow_start:slow_start+50000]
slow_end_marker = slow_sections.find('\n];\n')
slow_content = content[slow_start:slow_start+slow_end_marker+4]

# Extract getSegmentBasedSpeedLimitsTHB function (lines 1797-2046)
thb_start = content.find('function getSegmentBasedSpeedLimitsTHB() {')
thb_end = content.find('];', thb_start) + 2
thb_content = content[thb_start:thb_end]

def parse_segment_limits(js_content):
    """Parse JavaScript segment limits array to Python dict"""
    # Extract the return array
    match = re.search(r'return\s+\[(.*)\];', js_content, re.DOTALL)
    if not match:
        return []

    array_content = match.group(1)

    segments = []
    # Split by segment objects
    segment_blocks = re.findall(r'\{[\s\S]*?segment:\s*"([^"]+)"[\s\S]*?limits:\s*\[([\s\S]*?)\][\s\S]*?\}(?=,\s*\{|$)', array_content)

    for segment_name, limits_str in segment_blocks:
        # Parse individual limits
        limits = []
        limit_matches = re.findall(r'\{\s*startPct:\s*([\d.]+),\s*endPct:\s*([\d.]+),\s*limit:\s*(\d+)\s*\}', limits_str)

        for start_pct, end_pct, limit in limit_matches:
            limits.append({
                'startPct': float(start_pct),
                'endPct': float(end_pct),
                'limit': int(limit)
            })

        segments.append({
            'segment': segment_name,
            'limits': limits
        })

    return segments

# Parse all three datasets
print("Parsing fast segments...")
fast_segments = parse_segment_limits(fast_content)
print(f"Found {len(fast_segments)} fast segments")

print("\nParsing slow segments...")
slow_segments = parse_segment_limits(slow_content)
print(f"Found {len(slow_segments)} slow segments")

print("\nParsing THB segments...")
thb_segments = parse_segment_limits(thb_content)
print(f"Found {len(thb_segments)} THB segments")

# Write to JSON files
print("\nWriting fast_segments.json...")
with open('reference_data/fast_segments.json', 'w') as f:
    json.dump(fast_segments, f, indent=2)

print("Writing slow_segments.json...")
with open('reference_data/slow_segments.json', 'w') as f:
    json.dump(slow_segments, f, indent=2)

print("Writing thb_segments.json...")
with open('reference_data/thb_segments.json', 'w') as f:
    json.dump(thb_segments, f, indent=2)

print("\n✅ All segment files created successfully!")
print(f"  - fast_segments.json: {len(fast_segments)} segments")
print(f"  - slow_segments.json: {len(slow_segments)} segments")
print(f"  - thb_segments.json: {len(thb_segments)} segments")
