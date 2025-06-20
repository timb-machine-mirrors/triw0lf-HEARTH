import os
import sys
import re
import requests
from pathlib import Path

# --- Constants ---
CTI_INPUT_DIR = Path(".hearth/intel-drops/")
CTI_INPUT_DIR.mkdir(parents=True, exist_ok=True)

# --- Functions ---
def get_issue_body_parts(body):
    """Extracts content from the CTI Paste and CTI Link fields in the issue body."""
    paste_content = ""
    link_content = ""

    # Regex to find the content of a specific textarea or input field
    # This looks for the heading and captures everything until the next heading or end of string.
    paste_match = re.search(r"### Pasted CTI\s*\n\s*(.*?)\n\s*### Link to CTI", body, re.DOTALL)
    if paste_match:
        paste_content = paste_match.group(1).strip()
        # Handle GitHub's "No response was provided" placeholder
        if "_No response was provided_" in paste_content:
            paste_content = ""

    link_match = re.search(r"### Link to CTI\s*\n\s*(.*)", body, re.DOTALL)
    if link_match:
        link_content = link_match.group(1).strip()
        if "_No response was provided_" in link_content:
            link_content = ""
            
    return paste_content, link_content

def download_file(url, out_path):
    """Downloads a file from a URL and saves it."""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()  # Raise an exception for bad status codes
        out_path.write_bytes(response.content)
        print(f"✅ Successfully downloaded CTI from {url}")
        return True
    except requests.RequestException as e:
        print(f"❌ Error downloading file from {url}: {e}")
        return False

def main():
    """Main function to process the issue body."""
    issue_body = os.getenv("ISSUE_BODY")
    issue_number = os.getenv("ISSUE_NUMBER")

    if not issue_body or not issue_number:
        print("❌ Error: ISSUE_BODY and ISSUE_NUMBER environment variables are required.")
        sys.exit(1)

    pasted_cti, cti_link = get_issue_body_parts(issue_body)
    
    output_filename = CTI_INPUT_DIR / f"issue-{issue_number}.txt"

    if cti_link:
        print(f"ℹ️ Found CTI link: {cti_link}. Attempting to download...")
        # Note: This simple downloader works for direct links.
        # It won't handle pages that need rendering or are behind logins.
        if not download_file(cti_link, output_filename):
            print("❌ Failed to download from link. The workflow will stop.")
            sys.exit(1)
            
    elif pasted_cti:
        print("ℹ️ Found pasted CTI. Saving content to file...")
        output_filename.write_text(pasted_cti)
        print(f"✅ Successfully saved pasted CTI to {output_filename}")
        
    else:
        print("🤷 No CTI content found in the issue body (neither paste nor link).")
        print("✅ Gracefully exiting, nothing to process.")
        # Exit with success because this isn't a failure, just nothing to do.
        sys.exit(0)

if __name__ == "__main__":
    main() 