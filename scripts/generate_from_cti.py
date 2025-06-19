import os
import time
import re
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

CTI_INPUT_DIR = Path(".hearth/intel-drops/")
OUTPUT_DIR    = Path(".hearth/auto-drafts/")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Counter for hunt IDs
HUNT_COUNTER = 1

SYSTEM_PROMPT = """You are a threat hunter generating HEARTH markdown files.
Each file MUST focus on exactly ONE MITRE ATT&CK technique - no exceptions.
You MUST scope the hypothesis to be as narrow and specific as possible.
CRITICAL: Do NOT list or enumerate techniques at the start of the markdown file.
The markdown MUST start directly with the hunt ID heading (e.g., "# H-2025-001").

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
- Start directly with the hunt ID heading - no technique lists or preambles
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
1. Identify ALL MITRE ATT&CK techniques implied in the CTI (but do not list them in the output).
2. Select ONE technique to focus on using these criteria in order:
   a. Actionability: Which TTP leaves the clearest evidence in logs/telemetry?
   b. Impact: Which TTP most directly enables adversary objectives?
   c. Uniqueness: Which TTP is most distinctive of this specific threat?
   d. Detection Gap: Which TTP is commonly missed by security tools?
3. Write a hypothesis that is EXTREMELY specific:
   - Must follow this exact pattern:
     [Actor type] are [precise technical behavior] to [immediate tactical goal] on [specific target]
   - The behavior must include exact technical details (commands, registry keys, file paths, etc.)
   - The goal must be immediate and tactical (not strategic)
   - The target must specify exact systems/services/data
4. Use one of: Threat actors | Adversaries | Attackers

IMPORTANT: Your output markdown MUST start with "# {hunt_id}" - do not include any technique lists or other content before this.

Example transformation from broad to specific:
TOO BROAD: "Adversaries are using PowerShell for execution"
SPECIFIC: "Adversaries are using PowerShell's Add-MpPreference cmdlet to disable real-time monitoring by adding exclusion paths to Windows Defender on domain-joined workstations"

Format the hunt EXACTLY as follows, starting with the hunt ID:

# {hunt_id}
[Your extremely specific hypothesis]

| Hunt #       | Idea / Hypothesis                                                      | Tactic         | Notes                                      | Tags                           | Submitter                                   |
|--------------|-------------------------------------------------------------------------|----------------|--------------------------------------------|--------------------------------|---------------------------------------------|
| {hunt_id}    | [Same hypothesis]                                                      | [MITRE Tactic] | Based on ATT&CK technique [Txxxx], using… | #[tactic] #[technique] #[tag] | [hearth-auto-intel](https://github.com/THORCollective/HEARTH) |

## Why
- [Specific technical reason why this precise behavior matters to detect]
- [Immediate tactical impact if this specific technique succeeds]
- [How this specific implementation ties to larger campaigns]
- [Technical details of why this technique was chosen over others mentioned in the CTI]

## References
- [Single MITRE ATT&CK technique link with technique number]
- [Source CTI report link]
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

def generate_hunt(cti_text, hunt_id, out_path):
    """Generate a hunt hypothesis from CTI text."""
    try:
        summary = summarize_cti(cti_text)
        # Generate hunt with single GPT-4 call
        prompt = USER_TEMPLATE.format(cti_text=summary, hunt_id=hunt_id)
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role":"system","content":SYSTEM_PROMPT},
                     {"role":"user","content":prompt}],
            temperature=0.2,
            max_tokens=800
        )
        content = response.choices[0].message.content.strip()
        
        # Save the hunt
        with open(out_path, "w") as f:
            f.write(content)
        print(f"✅ {hunt_id} → {out_path}")
    except Exception as e:
        print(f"❌ Error processing {hunt_id}: {str(e)}")

if __name__ == "__main__":
    for txt in CTI_INPUT_DIR.glob("*.txt"):
        content = txt.read_text()
        hunt_id = f"H-2025-{HUNT_COUNTER:03d}"  # Format: H-2025-001, H-2025-002, etc.
        HUNT_COUNTER += 1
        out_md  = OUTPUT_DIR / f"{hunt_id}.md"
        generate_hunt(content, hunt_id, out_md)
