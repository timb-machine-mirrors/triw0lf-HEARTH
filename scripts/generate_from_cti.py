import os
import time
import re
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv
from PyPDF2 import PdfReader

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

CTI_INPUT_DIR = Path(".hearth/intel-drops/")
OUTPUT_DIR    = Path("Flames/")
PROCESSED_DIR = Path(".hearth/processed-intel-drops/")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

def get_next_hunt_id():
    """Scans the Flames/ directory to find the next available hunt ID."""
    flames_dir = Path("Flames/")
    flames_dir.mkdir(exist_ok=True)
    max_id = 0
    hunt_pattern = re.compile(r"H-\d{4}-(\d{3,})\.md")
    for f in flames_dir.glob("H-*.md"):
        match = hunt_pattern.match(f.name)
        if match:
            current_id = int(match.group(1))
            if current_id > max_id:
                max_id = current_id
    return max_id + 1

SYSTEM_PROMPT = """You are a threat hunter generating HEARTH markdown files.
Each file MUST focus on exactly ONE MITRE ATT&CK technique - no exceptions.
You MUST scope the hypothesis to be as narrow and specific as possible.
CRITICAL: Do NOT list or enumerate techniques at the start of the markdown file.
The markdown MUST start directly with the hypothesis text, not a heading.

When selecting which technique to focus on from multiple TTPs, prioritize based on:
1. Actionability - Choose the TTP that is most observable in logs/telemetry
2. Impact - Prioritize TTPs that directly lead to adversary objectives
3. Uniqueness - Prefer TTPs that are more distinctive of the specific threat
4. Detection Gap - Consider TTPs that are commonly missed by security tools

All hypotheses must:
- Focus on a single, specific MITRE ATT&CK technique only
- Be behaviorally specific to that one TTP
- Include EXACTLY these four parts:
  1. Actor type (e.g., "Threat actors", "Adversaries", "Attackers")
  2. Precise behavior (specific commands, tools, or methods being used)
  3. Immediate tactical goal (what the technique directly achieves)
  4. Specific target (exact systems, services, or data affected)
- Use firm language (e.g., "Threat actors are…", "Adversaries are…")
- Avoid actor names in the hypothesis (they go in the Why section)
- Do not include MITRE technique numbers in the hypothesis
- The output MUST begin directly with the hypothesis text. DO NOT include a title or markdown heading.
- If it's a vulnerability, do not use the CVE name or state it's a known vulnerability but rather the technique name

Examples of BAD (too broad) hypotheses:
❌ "Threat actors are using PowerShell to execute malicious code"
❌ "Adversaries are exploiting vulnerabilities in web applications"
❌ "Attackers are using valid credentials to access systems"

Examples of GOOD (narrow) hypotheses:
✅ "Threat actors are using PowerShell's Invoke-WebRequest cmdlet to download encrypted payloads from Discord CDN to evade network detection"
✅ "Adversaries are modifying Windows Registry Run keys in HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run to maintain persistence across system reboots"
✅ "Attackers are creating scheduled tasks with random 8-character alphanumeric names to execute Base64-encoded PowerShell commands at system startup"
"""

USER_TEMPLATE = """CTI REPORT:

{cti_text}

---

Instructions:
1.  Read the CTI Report.
2.  Select the single most actionable MITRE ATT&CK technique from the report.
3.  Write a specific, narrow, and actionable hunt hypothesis based on that technique.
4.  Write a "Why" section explaining the importance of the hunt.
5.  Write a "References" section with a link to the chosen MITRE technique and the source CTI.
6.  The output MUST be only the content for the hunt, starting with the hypothesis. DO NOT include a title or the metadata table.

Your output should look like this:

[Your extremely specific hypothesis]

| Hunt #       | Idea / Hypothesis                                                      | Tactic         | Notes                                      | Tags                           | Submitter                                   |
|--------------|-------------------------------------------------------------------------|----------------|--------------------------------------------|--------------------------------|---------------------------------------------|
| [Leave blank] | [Same hypothesis]                                                      | [MITRE Tactic] | Based on ATT&CK technique [Txxxx], using… | #[tactic] #[technique] #[tag] | [hearth-auto-intel](https://github.com/THORCollective/HEARTH) |

## Why
- [Why this behavior is important to detect]
- [Tactical impact of success]
- [Links to larger campaigns]

## References
- [MITRE ATT&CK link]
- [Source CTI Report]({cti_source_url})
"""

def summarize_cti(text, max_length=6000):
    """Summarize CTI text, with improved handling for large inputs."""
    if len(text) <= max_length:
        return text
    
    # First attempt: Try direct summarization with GPT-3.5-turbo (higher rate limits)
    try:
        resp = client.chat.completions.create(
            model="gpt-3.5-turbo",  # Using 3.5 for initial summary to avoid rate limits
            messages=[{"role":"user","content":
                "Summarize this threat intel for hunting analysis (1000 chars max):\n\n" + text[:4000]  # Limit input size
            }],
            temperature=0.2,
            max_tokens=400  # Reduced token limit
        )
        summary = resp.choices[0].message.content.strip()
        
        # Second pass with GPT-4 for refinement if needed
        try:
            resp = client.chat.completions.create(
                model="gpt-4",
                messages=[{"role":"user","content":
                    "Refine this threat intel summary for hunting analysis (800 chars max):\n\n" + summary
                }],
                temperature=0.2,
                max_tokens=300
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            print(f"Warning: GPT-4 refinement failed, using GPT-3.5 summary instead: {str(e)}")
            return summary
            
    except Exception as e:
        print(f"Warning: Summarization failed: {str(e)}")
        # Fallback: return truncated text with warning
        return f"WARNING: Summarization failed. Using truncated text:\n\n{text[:2000]}..."

def clean_hunt_content(content):
    """Clean up the AI-generated content by removing unwanted parts."""
    lines = content.split('\n')
    cleaned_lines = []
    skip_until_hypothesis = True
    
    for line in lines:
        # Skip everything until we find the actual hypothesis
        if skip_until_hypothesis:
            # Look for lines that start with the hypothesis (not CTI REPORT, not Hypothesis: label)
            if (line.strip() and 
                not line.startswith('CTI REPORT:') and 
                not line.startswith('Hypothesis:') and
                not line.startswith('---') and
                not line.startswith('Instructions:') and
                not line.startswith('Your output should look like this:') and
                not line.startswith('[Your extremely specific hypothesis]') and
                not line.startswith('| Hunt #') and
                not line.startswith('|--------------') and
                not line.startswith('| [Leave blank]') and
                not line.startswith('## Why') and
                not line.startswith('## References')):
                # This looks like the actual hypothesis
                skip_until_hypothesis = False
                cleaned_lines.append(line)
        else:
            # We're past the hypothesis, include everything else
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines).strip()

def generate_hunt_content(cti_text, cti_source_url):
    """Generate just the core content of a hunt from CTI text."""
    try:
        summary = summarize_cti(cti_text)
        prompt = USER_TEMPLATE.format(cti_text=summary, cti_source_url=cti_source_url)
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role":"system","content":SYSTEM_PROMPT},
                     {"role":"user","content":prompt}],
            temperature=0.2,
            max_tokens=800
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"❌ Error generating hunt content: {str(e)}")
        return None

def read_file_content(file_path):
    """Read content from either PDF or text file."""
    if file_path.suffix.lower() == '.pdf':
        try:
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            print(f"Error reading PDF {file_path}: {str(e)}")
            return None
    else:
        try:
            return file_path.read_text()
        except Exception as e:
            print(f"Error reading file {file_path}: {str(e)}")
            return None

if __name__ == "__main__":
    existing_hunt_path = os.getenv("EXISTING_HUNT_FILE")
    
    if existing_hunt_path:
        out_md_path = Path(existing_hunt_path)
        hunt_id = out_md_path.stem
        print(f"🔄 Regenerating hunt for {hunt_id} at {out_md_path}")
    else:
        next_hunt_number = get_next_hunt_id()
        hunt_id = f"H-2025-{next_hunt_number:03d}"
        out_md_path = OUTPUT_DIR / f"{hunt_id}.md"
        print(f"✨ Generating new hunt {hunt_id} at {out_md_path}")

    cti_source_url = os.getenv("CTI_SOURCE_URL", "URL not provided")
    files_to_process = list(CTI_INPUT_DIR.glob("*.[tp][dx][tf]"))

    # Since this script runs per-issue, we only expect one file.
    if files_to_process:
        file_path = files_to_process[0]
        cti_content = read_file_content(file_path)
        
        if cti_content:
            # 1. Generate the core hunt content from the AI
            hunt_body = generate_hunt_content(cti_content, cti_source_url)

            if hunt_body:
                # 2. Clean up the AI-generated content
                cleaned_hunt_body = clean_hunt_content(hunt_body)
                
                # 3. Construct the full markdown file
                final_content = f"# {hunt_id}\n\n"
                final_content += cleaned_hunt_body
                final_content = final_content.replace("| [Leave blank] |", f"| {hunt_id}    |")

                # 4. Save the final file
                try:
                    with open(out_md_path, "w") as f:
                        f.write(final_content)
                    print(f"✅ {hunt_id} → {out_md_path}")
                    if os.getenv("GITHUB_OUTPUT"):
                        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
                            print(f"generated_file_path={out_md_path}", file=f)
                    
                    # 5. Move the processed intel file if it's a new hunt
                    if not existing_hunt_path:
                        dest_path = PROCESSED_DIR / file_path.name
                        file_path.rename(dest_path)
                        print(f"✅ Moved {file_path.name} to {PROCESSED_DIR.name}")

                except Exception as e:
                    print(f"❌ Could not write file or move intel: {e}")
            else:
                print(f"❌ Failed to generate hunt content for {file_path.name}")
        else:
            print(f"❌ Skipping {file_path} due to reading errors")
    else:
        print("🤷 No CTI files found to process.")
