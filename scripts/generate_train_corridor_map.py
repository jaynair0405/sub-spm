"""
Generate train_corridor_map.csv based on train code patterns
This script creates the direct train→corridor lookup table for Phase 1 implementation
"""
import pandas as pd

# Read the All Locals CSV
df = pd.read_csv("Sub  SPM Data Analysis - All Locals.csv")

# Initialize result list
train_mappings = []

# Train code prefix to corridor mapping logic
def map_train_to_corridor(train_num, train_code):
    """
    Maps train number and code to corridor info
    Returns: dict with Train, Type, Route, Direction, FromExpected, ToExpected, Notes
    """
    # Convert train code to string and get prefix
    code_str = str(train_code)
    prefix = code_str[:3]

    # Determine direction (last digit: even=UP, odd=DN)
    last_digit = int(code_str[-1])
    direction = "UP" if last_digit % 2 == 0 else "DN"

    # Default values
    train_type = 0  # 0=Single, 1=Slow, 2=Fast
    route = "MAIN"
    from_expected = ""
    to_expected = ""
    notes = ""

    # Main Line Fast Locals
    if prefix == "950":
        train_type = 2
        route = "SE"
        from_expected, to_expected = ("CSMT", "KHPI") if direction == "UP" else ("KHPI", "CSMT")
    elif prefix == "951":
        train_type = 2
        route = "SE"
        from_expected, to_expected = ("CSMT", "KJT") if direction == "UP" else ("KJT", "CSMT")
    elif prefix == "952":
        train_type = 2
        route = "SE"
        from_expected, to_expected = ("CSMT", "BUD") if direction == "UP" else ("BUD", "CSMT")
    elif prefix == "953":
        train_type = 2
        route = "SE"
        from_expected, to_expected = ("CSMT", "ABH") if direction == "UP" else ("ABH", "CSMT")
    elif prefix == "954":
        train_type = 2
        route = "NE"
        from_expected, to_expected = ("CSMT", "KSRA") if direction == "UP" else ("KSRA", "CSMT")
    elif prefix == "955":
        train_type = 2
        route = "NE"
        from_expected, to_expected = ("CSMT", "ASO") if direction == "UP" else ("ASO", "CSMT")
    elif prefix == "956":
        train_type = 2
        route = "NE"
        from_expected, to_expected = ("CSMT", "TLA") if direction == "UP" else ("TLA", "CSMT")
    elif prefix == "957":
        train_type = 2
        route = "MAIN"
        from_expected, to_expected = ("CSMT", "KYN") if direction == "UP" else ("KYN", "CSMT")
    elif prefix == "958":
        train_type = 2
        route = "MAIN"
        from_expected, to_expected = ("CSMT", "DI") if direction == "UP" else ("DI", "CSMT")
    elif prefix == "959":
        train_type = 2
        route = "MAIN"
        from_expected, to_expected = ("CSMT", "TNA") if direction == "UP" else ("TNA", "CSMT")

    # Main Line Slow Locals
    elif prefix == "960":
        train_type = 1
        route = "SE"
        from_expected, to_expected = ("CSMT", "KHPI") if direction == "UP" else ("KHPI", "CSMT")
    elif prefix == "961":
        train_type = 1
        route = "SE"
        from_expected, to_expected = ("CSMT", "KJT") if direction == "UP" else ("KJT", "CSMT")
    elif prefix == "962":
        train_type = 1
        route = "SE"
        from_expected, to_expected = ("CSMT", "BUD") if direction == "UP" else ("BUD", "CSMT")
    elif prefix == "963":
        train_type = 1
        route = "SE"
        from_expected, to_expected = ("CSMT", "ABH") if direction == "UP" else ("ABH", "CSMT")
    elif prefix == "964":
        train_type = 1
        route = "NE"
        from_expected, to_expected = ("CSMT", "KSRA") if direction == "UP" else ("KSRA", "CSMT")
    elif prefix == "965":
        train_type = 1
        route = "NE"
        from_expected, to_expected = ("CSMT", "ASO") if direction == "UP" else ("ASO", "CSMT")
    elif prefix == "966":
        train_type = 1
        route = "NE"
        from_expected, to_expected = ("CSMT", "TLA") if direction == "UP" else ("TLA", "CSMT")
    elif prefix in ["970", "971"]:
        train_type = 1
        route = "MAIN"
        from_expected, to_expected = ("CSMT", "KYN") if direction == "UP" else ("KYN", "CSMT")
    elif prefix == "972":
        train_type = 1
        route = "MAIN"
        from_expected, to_expected = ("CSMT", "DI") if direction == "UP" else ("DI", "CSMT")
    elif prefix in ["973", "974"]:
        train_type = 1
        route = "MAIN"
        from_expected, to_expected = ("CSMT", "TNA") if direction == "UP" else ("TNA", "CSMT")
    elif prefix == "975":
        train_type = 1
        route = "MAIN"
        from_expected, to_expected = ("CSMT", "GC") if direction == "UP" else ("GC", "CSMT")
    elif prefix == "976":
        train_type = 1
        route = "MAIN"
        from_expected, to_expected = ("CSMT", "CLA") if direction == "UP" else ("CLA", "CSMT")

    # Harbour Line
    elif prefix in ["980", "981", "982"]:
        train_type = 0
        route = "HARBOUR"
        from_expected, to_expected = ("CSMTH", "PNVL") if direction == "UP" else ("PNVL", "CSMTH")
        notes = "Harbour Line to PNVL"
    elif prefix in ["983", "984"]:
        train_type = 0
        route = "HARBOUR"
        from_expected, to_expected = ("CSMTH", "BEPR") if direction == "UP" else ("BEPR", "CSMTH")
        notes = "Harbour Line to BEPR"
    elif prefix == "985":
        train_type = 0
        route = "HARBOUR"
        from_expected, to_expected = ("CSMTH", "VSH") if direction == "UP" else ("VSH", "CSMTH")
        notes = "Harbour Line to VSH"
    elif prefix == "986":
        train_type = 0
        route = "HARBOUR"
        from_expected, to_expected = ("CSMTH", "MNKD") if direction == "UP" else ("MNKD", "CSMTH")
        notes = "Harbour Line short distance"
    elif prefix == "987":
        train_type = 0
        route = "HARBOUR"
        from_expected, to_expected = ("CSMTH", "GMN") if direction == "UP" else ("GMN", "CSMTH")
        notes = "GMN special - check actual route"
    elif prefix == "988":
        train_type = 0
        route = "HARBOUR"
        from_expected, to_expected = ("CSMTH", "BA") if direction == "UP" else ("BA", "CSMTH")
        notes = "Harbour Line BA route"
    elif prefix == "989":
        train_type = 0
        route = "HARBOUR"
        from_expected, to_expected = ("PNVL", "GMN") if direction == "UP" else ("GMN", "PNVL")
        notes = "GMN-PNVL special - check actual route"

    # Trans-Harbour Line
    elif prefix == "990":
        train_type = 0
        route = "THB_PNVL"
        from_expected, to_expected = ("TNA", "PNVL") if direction == "UP" else ("PNVL", "TNA")
        notes = "Trans-Harbour to PNVL"
    elif prefix in ["992", "993"]:
        train_type = 0
        route = "THB_NEU"
        from_expected, to_expected = ("TNA", "NEU_THB") if direction == "UP" else ("NEU_THB", "TNA")
        notes = "Trans-Harbour to NEU_THB"
    elif prefix in ["994", "995"]:
        train_type = 0
        route = "THB_VSH"
        from_expected, to_expected = ("TNA", "VSH_THB") if direction == "UP" else ("VSH_THB", "TNA")
        notes = "Trans-Harbour to VSH_THB"

    # Port Line
    elif prefix == "996":
        train_type = 0
        route = "PORT"
        from_expected, to_expected = ("URAN", "NEU") if direction == "UP" else ("NEU", "URAN")
        notes = "Port Line to NEU"
    elif prefix == "997":
        train_type = 0
        route = "PORT"
        from_expected, to_expected = ("URAN", "BEPR") if direction == "UP" else ("BEPR", "URAN")
        notes = "Port Line to BEPR"

    # Special codes (GMN with special pattern)
    elif prefix == "913" or prefix == "914":
        train_type = 0
        route = "HARBOUR"
        from_expected, to_expected = ("CSMTH", "GMN") if direction == "UP" else ("GMN", "CSMTH")
        notes = "Special GMN code pattern"

    else:
        # Unknown pattern - mark for review
        train_type = 0
        route = "UNKNOWN"
        notes = f"Unknown train code pattern: {code_str}"

    return {
        "Train": train_num,
        "TrainCode": train_code,
        "Type": train_type,
        "Route": route,
        "Direction": direction,
        "FromExpected": from_expected,
        "ToExpected": to_expected,
        "Notes": notes
    }

# Process each train
for _, row in df.iterrows():
    train_num = row["Train No"]
    train_code = row["Train Code"]

    mapping = map_train_to_corridor(train_num, train_code)
    train_mappings.append(mapping)

# Create DataFrame
result_df = pd.DataFrame(train_mappings)

# Save to CSV
output_file = "train_corridor_map.csv"
result_df.to_csv(output_file, index=False)

print(f"✓ Created {output_file} with {len(result_df)} train mappings")

# Show summary statistics
print("\n=== Summary Statistics ===")
print(f"Total trains: {len(result_df)}")
print(f"\nBy Type:")
print(result_df["Type"].value_counts().to_dict())
print(f"  0 = Single type (no Fast/Slow distinction)")
print(f"  1 = Slow")
print(f"  2 = Fast")
print(f"\nBy Route:")
print(result_df["Route"].value_counts().to_dict())
print(f"\nBy Direction:")
print(result_df["Direction"].value_counts().to_dict())

# Show sample rows
print(f"\n=== Sample Mappings ===")
print(result_df.head(20).to_string(index=False))

# Show unknown patterns if any
unknown = result_df[result_df["Route"] == "UNKNOWN"]
if len(unknown) > 0:
    print(f"\n⚠ Found {len(unknown)} trains with unknown patterns:")
    print(unknown[["Train", "TrainCode", "Notes"]].to_string(index=False))
