import os
import sys
import re
from pathlib import Path

# --- Constants ---
CTI_INPUT_DIR = Path(".hearth/intel-drops/")
CTI_INPUT_DIR.mkdir(parents=True, exist_ok=True)

# --- Functions ---
def get_pasted_cti(body):
    """Extracts content from the 'Pasted CTI' section of the issue body."""
    # This looks for the "Pasted CTI" heading and captures everything until the horizontal rule (---)
    match = re.search(r"### Pasted CTI\s*\n\s*(.*?)\n\s*---", body, re.DOTALL)
    if match:
        content = match.group(1).strip()
        # Ignore placeholder comments and instructions
        if content.startswith("<!--") or "See attached file" in content:
            return ""
        return content
    return ""

def main():
    """Main function to process the issue body."""
    issue_body = os.getenv("ISSUE_BODY")
    issue_number = os.getenv("ISSUE_NUMBER")

    if not issue_body or not issue_number:
        print("❌ Error: ISSUE_BODY and ISSUE_NUMBER environment variables are required.")
        sys.exit(1)

    pasted_cti = get_pasted_cti(issue_body)
    
    # The workflow will try to download an attachment first. 
    # This script only runs as a fallback if no attachment is found.
    if pasted_cti:
        print("ℹ️ Found pasted CTI. Saving content to file...")
        output_filename = CTI_INPUT_DIR / f"issue-{issue_number}-pasted.txt"
        output_filename.write_text(pasted_cti)
        print(f"✅ Successfully saved pasted CTI to {output_filename}")
    else:
        print("🤷 No usable CTI content was pasted into the issue body.")
        print("✅ Gracefully exiting, as there is nothing to process from text.")
        # Exit with success because this isn't a failure, just nothing to do.
        sys.exit(0)

if __name__ == "__main__":
    main() 