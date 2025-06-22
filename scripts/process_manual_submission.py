import os
import re
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are an expert threat hunter, and your task is to reformat a manually submitted hunt idea into the official HEARTH markdown format.
You will be given the raw components of a hunt (hypothesis, tactic, technique, etc.).
Your job is to assemble these into a complete and perfectly formatted markdown file.
CRITICAL: The final output must be ONLY the markdown content, starting directly with the hypothesis text. Do not include the title or any other conversational text.
"""

USER_TEMPLATE = """A user has submitted the following hunt details. Please format them into a HEARTH markdown file.

---
**Hypothesis:** {hypothesis}
**Tactic:** {tactic}
**Technique ID:** {technique_id}
**Why it's important:** {why}
**References:** {references}
**Submitter:** {submitter_credit}
---

Instructions:
1.  Use the Hypothesis as the main "Idea / Hypothesis" in the table.
2.  Use the Tactic provided.
3.  Create a "Notes" entry that says "Based on ATT&CK technique {technique_id}."
4.  Generate relevant tags based on the content (e.g., #tactic, #technique, #tool, #malware).
5.  Use the submitter information for the "Submitter" column.
6.  Populate the "Why" and "References" sections with the content provided.
7.  The final output MUST start with the hypothesis text, followed by the markdown table and the other sections.

The final markdown file content should look like this:

[The user's hypothesis]

| Hunt #       | Idea / Hypothesis                                                      | Tactic         | Notes                                      | Tags                           | Submitter           |
|--------------|-------------------------------------------------------------------------|----------------|--------------------------------------------|--------------------------------|---------------------|
| [Leave blank] | [The user's hypothesis]                                                | {tactic}       | Based on ATT&CK technique {technique_id}.  | #[tactic] #[technique] #[tag] | {submitter_credit} |

## Why
{why}

## References
{references}
"""

def parse_issue_body(body):
    """Parses the structured data from a GitHub issue body."""
    details = {}
    sections = body.split('###')[1:]
    for section in sections:
        try:
            lines = section.strip().split('\n')
            header = lines[0].strip().lower()
            content = "\n".join(lines[1:]).strip()
            
            if "hunt hypothesis" in header:
                details['hypothesis'] = content
            elif "mitre att&ck tactic" in header:
                details['tactic'] = content
            elif "mitre att&ck technique id" in header:
                details['technique_id'] = content
            elif "why is this hunt important" in header:
                details['why'] = content
            elif "references" in header:
                details['references'] = content
            elif "your name / handle" in header:
                details['submitter_name'] = content
            elif "link to profile" in header:
                details['submitter_link'] = content
        except IndexError:
            continue # Ignore malformed sections
    return details

def generate_hunt_file(details):
    """Generates the hunt file content using the AI."""
    submitter_credit = details.get('submitter_name', 'A Helpful Contributor')
    if details.get('submitter_link'):
        submitter_credit = f"[{submitter_credit}]({details['submitter_link']})"

    prompt = USER_TEMPLATE.format(
        hypothesis=details.get('hypothesis', ''),
        tactic=details.get('tactic', ''),
        technique_id=details.get('technique_id', ''),
        why=details.get('why', ''),
        references=details.get('references', ''),
        submitter_credit=submitter_credit
    )
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=1000
    )
    return response.choices[0].message.content.strip()

if __name__ == "__main__":
    issue_body = os.getenv("ISSUE_BODY")
    if not issue_body:
        raise ValueError("ISSUE_BODY environment variable not set.")

    # 1. Parse details from issue
    hunt_details = parse_issue_body(issue_body)
    
    # 2. Determine next hunt ID
    hunt_files = list(Path("./Flames").glob("H*.md"))
    next_hunt_num = 1
    if hunt_files:
        hunt_numbers = [int(f.stem.split('-')[-1]) for f in hunt_files if f.stem.split('-')[-1].isdigit()]
        if hunt_numbers:
            next_hunt_num = max(hunt_numbers) + 1
    
    year = datetime.now().year
    hunt_id = f"H-{year}-{next_hunt_num:03d}"
    out_md_path = Path(f"Flames/{hunt_id}.md")

    # 3. Generate the core content
    hunt_content = generate_hunt_file(hunt_details)

    # 4. Assemble the final file
    final_content = f"# {hunt_id}\n\n"
    final_content += hunt_content.replace("| [Leave blank] |", f"| {hunt_id}    |")

    # 5. Save the file
    with open(out_md_path, "w") as f:
        f.write(final_content)
    print(f"✅ Successfully wrote hunt to {out_md_path}")

    # 6. Set output for the workflow
    if 'GITHUB_OUTPUT' in os.environ:
        with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
            print(f'HUNT_FILE_PATH={out_md_path}', file=f)
            print(f'HUNT_ID={hunt_id}', file=f) 