"""
Extract segment speed limits from modifiedscripts.js and create JSON files.

RETIRED -- do not run. Kept as a record of how the JSON files were first
produced. See the guard below for why running it is a bad idea.
"""
import sys

sys.exit(
    "extract_segments.py is retired.\n"
    "\n"
    "reference_data/{fast,slow,thb}_segments.json are the source of truth now.\n"
    "psr_mps.py reads them directly, nothing reads modifiedscripts.js, and the\n"
    "Google Apps Script app this fed has been replaced by sub-spm itself.\n"
    "\n"
    "As written it cannot actually overwrite anything -- from the repo root it\n"
    "fails opening modifiedscripts.js (which lives in scripts/), and from\n"
    "scripts/ it fails writing to scripts/reference_data/ (which does not\n"
    "exist). Fixing those paths is the obvious move when you hit that error,\n"
    "and it is the wrong one: with the paths corrected this script emits\n"
    "\n"
    "    fast  178 segments  (live file has 179)\n"
    "    slow  178 segments  (live file has 198)\n"
    "    thb    31 segments  (live file has  32)\n"
    "\n"
    "because the function-boundary search below overshoots. It also matches\n"
    "startPct inside // comments, so ranges deliberately commented out come\n"
    "back as live data -- that is how SNPD-VSH and TKNG-CLA ended up with\n"
    "ranges that shadowed the ones following them.\n"
    "\n"
    "Edit the JSON files directly, then run tests/test_segment_limits.py."
)

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
