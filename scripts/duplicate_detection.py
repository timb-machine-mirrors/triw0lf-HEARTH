import os
import re
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv
from collections import defaultdict
import json
from hunt_parser_utils import (
    find_hunt_files,
    find_table_header_line,
    extract_table_cells,
    clean_markdown_formatting
)

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_all_existing_hunts():
    """Retrieves all existing hunt files and extracts their key information."""
    hunt_directories = ["Flames", "Embers", "Alchemy"]
    existing_hunts = []
    
    for directory_name in hunt_directories:
        directory_path = Path(directory_name)
        if not directory_path.exists():
            continue
            
        hunt_files = directory_path.glob("*.md")
        for hunt_file in hunt_files:
            try:
                content = hunt_file.read_text()
                hunt_information = extract_hunt_info(content, str(hunt_file))
                if hunt_information:
                    existing_hunts.append(hunt_information)
            except Exception as error:
                print(f"Error reading {hunt_file}: {error}")
    
    return existing_hunts

def extract_hunt_info(content, filepath):
    """Extracts key information from a hunt file for comparison."""
    lines = content.splitlines()
    
    # Extract hypothesis (first non-empty line)
    hypothesis = ""
    for line in lines:
        if line.strip() and not line.startswith('|') and not line.startswith('#'):
            hypothesis = line.strip()
            break
    
    # Extract tactic from the table
    tactic = ""
    for line in lines:
        if '|' in line and ('Tactic' in line or 'Technique' in line):
            # Find the data row
            line_index = lines.index(line)
            if line_index + 2 < len(lines):
                data_row = lines[line_index + 2]
                if '|' in data_row:
                    cells = [c.strip() for c in data_row.split('|') if c.strip()]
                    if len(cells) >= 3:  # Assuming tactic is in the 3rd column
                        tactic = cells[2]
            break
    
    # Extract tags
    tags = []
    for line in lines:
        if '#' in line and any(tag in line.lower() for tag in ['#t', '#persistence', '#execution', '#defense-evasion', '#discovery', '#lateral-movement', '#collection', '#command-and-control', '#exfiltration', '#impact']):
            tag_matches = re.findall(r'#\\w+', line)
            tags.extend(tag_matches)
    
    return {
        'filepath': filepath,
        'filename': Path(filepath).name,
        'hypothesis': hypothesis,
        'tactic': tactic,
        'tags': list(set(tags)),  # Remove duplicates
        'content': content[:500]  # First 500 chars for context
    }

def analyze_similarity(new_hunt, existing_hunts, threshold=0.7):
    """Uses AI to analyze similarity between a new hunt and existing hunts."""
    if not existing_hunts:
        return create_empty_analysis_result()
    
    filename_to_path_mapping = create_filename_path_mapping(existing_hunts)
    comparison_prompt = build_comparison_prompt(new_hunt, existing_hunts)
    
    try:
        ai_response = get_ai_similarity_analysis(comparison_prompt)
        return process_ai_response(ai_response, filename_to_path_mapping)
    except Exception as error:
        print(f"Error in AI analysis: {error}")
        return create_error_analysis_result(error)

def create_empty_analysis_result():
    """Create an empty analysis result structure."""
    return {
        "comparisons": [],
        "overall_assessment": "No existing hunts to compare against",
        "recommendation": "APPROVE"
    }

def create_filename_path_mapping(existing_hunts):
    """Create a mapping from filename to full path."""
    return {hunt['filename']: hunt['filepath'] for hunt in existing_hunts}

def build_comparison_prompt(new_hunt, existing_hunts):
    """Build the AI comparison prompt."""
    new_hunt_details = extract_new_hunt_details(new_hunt)
    existing_hunts_summary = create_existing_hunts_summary(existing_hunts)
    
    return f"""
You are analyzing a new threat hunt submission to check for potential duplicates or high similarity with existing hunts.

NEW HUNT SUBMISSION:
- Hypothesis: {new_hunt_details['hypothesis']}
- Tactic: {new_hunt_details['tactic']}
- Tags: {', '.join(new_hunt_details['tags'])}

EXISTING HUNTS TO COMPARE AGAINST:
{existing_hunts_summary}

TASK: Analyze the similarity between the new hunt and each existing hunt. Consider:
1. Conceptual similarity (same core technique or behavior)
2. Technical similarity (same tools, commands, or methods)
3. Target similarity (same systems, services, or data)
4. Tactical similarity (same MITRE ATT&CK technique)

For each existing hunt, provide:
- Similarity score (0-100, where 100 is identical)
- Brief explanation of why they are/aren't similar
- Recommendation: "DUPLICATE", "SIMILAR", or "UNIQUE"

Respond in JSON format:
{{
    "comparisons": [
        {{
            "hunt_filename": "filename.md",
            "similarity_score": 85,
            "explanation": "Both focus on the same PowerShell technique...",
            "recommendation": "SIMILAR"
        }}
    ],
    "overall_assessment": "This hunt appears to be...",
    "recommendation": "APPROVE" or "FLAG_FOR_REVIEW"
}}

Only include hunts with similarity scores above 50.
"""

def extract_new_hunt_details(new_hunt):
    """Extract details from new hunt for comparison."""
    return {
        'hypothesis': new_hunt.get('hypothesis', ''),
        'tactic': new_hunt.get('tactic', ''),
        'tags': new_hunt.get('tags', [])
    }

def create_existing_hunts_summary(existing_hunts):
    """Create a summary of existing hunts for comparison."""
    summary_parts = []
    # Limit to 10 most recent for performance
    for index, hunt in enumerate(existing_hunts[:10]):
        hunt_summary = f"""
Hunt {index + 1} ({hunt['filename']}):
- Hypothesis: {hunt['hypothesis']}
- Tactic: {hunt['tactic']}
- Tags: {', '.join(hunt['tags'])}
"""
        summary_parts.append(hunt_summary)
    
    return chr(10).join(summary_parts)

def get_ai_similarity_analysis(comparison_prompt):
    """Get AI analysis response."""
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a threat hunting expert analyzing hunt submissions for duplicates and similarities. Be thorough but fair in your assessment."},
            {"role": "user", "content": comparison_prompt}
        ],
        temperature=0.2,
        max_tokens=2000
    )
    return response.choices[0].message.content.strip()

def process_ai_response(ai_response, filename_to_path_mapping):
    """Process and parse AI response."""
    try:
        analysis_result = json.loads(ai_response)
        augment_analysis_with_file_paths(analysis_result, filename_to_path_mapping)
        return analysis_result
    except json.JSONDecodeError:
        return create_parse_error_result()

def augment_analysis_with_file_paths(analysis_result, filename_to_path_mapping):
    """Add file paths to analysis comparisons."""
    for comparison in analysis_result.get('comparisons', []):
        filename = comparison.get('hunt_filename')
        if filename in filename_to_path_mapping:
            comparison['hunt_filepath'] = filename_to_path_mapping[filename]

def create_parse_error_result():
    """Create result for JSON parsing errors."""
    return {
        "comparisons": [],
        "overall_assessment": "Could not parse AI analysis",
        "recommendation": "FLAG_FOR_REVIEW"
    }

def create_error_analysis_result(error):
    """Create result for analysis errors."""
    return {
        "comparisons": [],
        "overall_assessment": f"Error during analysis: {error}",
        "recommendation": "FLAG_FOR_REVIEW"
    }

def generate_duplicate_comment(analysis, new_hunt_info):
    """Generates a GitHub comment about potential duplicates."""
    comparisons = analysis.get('comparisons', [])
    if not comparisons:
        return "✅ **Duplicate Check Complete**\n\nNo similar existing hunts found. This appears to be a unique submission."

    # Sort by score (highest first) and limit to the top 5
    sorted_comparisons = sorted(comparisons, key=lambda x: x.get('similarity_score', 0), reverse=True)[:5]
    
    # The title is now handled by the workflow, so we start the comment content here.
    comment = f"**Overall Assessment:** {analysis.get('overall_assessment', 'Analysis completed')}\n\n"
    comment += "**Similar Existing Hunts:**\n\n"
    
    # Construct the base URL for file links from GitHub environment variables
    repo_url = f"{os.getenv('GITHUB_SERVER_URL', 'https://github.com')}/{os.getenv('GITHUB_REPOSITORY')}"
    branch = os.getenv('GITHUB_REF_NAME', 'main')

    for comp in sorted_comparisons:
        score = comp.get('similarity_score', 0)
        explanation = comp.get('explanation', 'No explanation provided')
        recommendation = comp.get('recommendation', 'UNKNOWN')
        
        filepath = comp.get('hunt_filepath')
        filename = comp.get('hunt_filename', 'Unknown')

        # Color code based on similarity
        if score >= 80:
            emoji = "🔴"
            status = "HIGH SIMILARITY"
        elif score >= 60:
            emoji = "🟡"
            status = "MODERATE SIMILARITY"
        else:
            emoji = "🟢"
            status = "LOW SIMILARITY"
        
        # Create a link if the filepath is available, otherwise just show the filename
        if filepath:
            file_url = f"{repo_url}/blob/{branch}/{filepath}"
            comment += f"{emoji} **[{filename}]({file_url})** (Similarity: {score}%)\n"
        else:
            comment += f"{emoji} **{filename}** (Similarity: {score}%)\n"

        comment += f"   - **Status:** {status} ({recommendation})\n"
        comment += f"   - **Explanation:** {explanation}\n\n"
    
    # Add recommendation
    overall_rec = analysis.get('recommendation', 'FLAG_FOR_REVIEW')
    if overall_rec == 'APPROVE':
        comment += "✅ **Recommendation:** This hunt appears unique and can be approved.\n\n"
    else:
        comment += "⚠️ **Recommendation:** Please review for potential duplication before approval.\n\n"
    
    comment += "---\n*This analysis was performed by AI duplicate detection. Please review manually before making final decisions.*"
    
    # Replace all escaped newlines with real newlines for GitHub markdown
    return comment.replace('\\n', '\n')

def check_duplicates_for_new_submission(new_hunt_content, new_hunt_filename):
    """Main function to check for duplicates in a new submission."""
    print("🔍 Starting duplicate detection...")
    
    # Extract info from new hunt
    new_hunt_info = extract_hunt_info(new_hunt_content, new_hunt_filename)
    if not new_hunt_info:
        return "❌ Could not extract hunt information from submission."
    
    # Get existing hunts
    existing_hunts = get_all_existing_hunts()
    print(f"📚 Found {len(existing_hunts)} existing hunts to compare against.")
    
    # Perform AI analysis
    analysis = analyze_similarity(new_hunt_info, existing_hunts)
    
    # Generate comment
    comment = generate_duplicate_comment(analysis, new_hunt_info)
    
    return comment

if __name__ == "__main__":
    # Test with a sample hunt
    test_content = """
Threat actors are using PowerShell's Invoke-WebRequest cmdlet to download encrypted payloads from Discord CDN to evade network detection.

| Hunt # | Idea / Hypothesis | Tactic | Notes | Tags | Submitter |
|--------|-------------------|--------|-------|------|-----------|
| | Threat actors are using PowerShell's Invoke-WebRequest cmdlet to download encrypted payloads from Discord CDN to evade network detection. | Defense Evasion | Based on ATT&CK technique T1071.001. | #defense-evasion #execution | test-user |

## Why
- This technique is commonly used by threat actors to evade detection
- Discord CDN is often trusted and may bypass security controls

## References
- [MITRE ATT&CK T1071.001](https://attack.mitre.org/techniques/T1071/001/)
- [Source CTI Report](https://example.com)
"""
    
    result = check_duplicates_for_new_submission(test_content, "test-hunt.md")
    print(result) 