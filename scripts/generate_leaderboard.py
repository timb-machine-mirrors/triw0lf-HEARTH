import os
from pathlib import Path
import re
from collections import Counter

def parse_submitter(cell_content):
    """Extracts the contributor's name from a markdown link or plain text."""
    match = re.search(r'\[([^\]]+)\]', cell_content)
    if match:
        return match.group(1).strip()
    return cell_content.strip()

def get_hunt_files():
    """Finds all hunt files in the project."""
    base_path = Path(".")
    hunt_dirs = ["Flames", "Embers", "Alchemy"]
    all_hunts = []
    for directory in hunt_dirs:
        all_hunts.extend(base_path.glob(f"{directory}/*.md"))
    return all_hunts

def generate_leaderboard():
    """Scans all hunts, counts contributions, and generates a new Contributors.md file."""
    all_hunts = get_hunt_files()
    contributors = []

    for hunt_file in all_hunts:
        try:
            content = hunt_file.read_text()
            # Find the markdown table and the submitter
            table_match = re.search(r'\|.*Submitter.*\|', content)
            if not table_match:
                continue

            header = table_match.group(0)
            columns = [c.strip() for c in header.split('|') if c.strip()]
            submitter_index = -1
            for i, col in enumerate(columns):
                if "Submitter" in col:
                    submitter_index = i
                    break
            
            if submitter_index == -1:
                continue

            # The row after the header contains the data
            data_row = content.splitlines()[content.splitlines().index(header) + 2]
            submitter_cell = data_row.split('|')[submitter_index + 1]
            
            submitter_name = parse_submitter(submitter_cell)
            if submitter_name and submitter_name != "hearth-auto-intel":
                contributors.append(submitter_name)
        except Exception as e:
            print(f"Could not process file {hunt_file}: {e}")

    counts = Counter(contributors)
    sorted_contributors = sorted(counts.items(), key=lambda item: item[1], reverse=True)

    # Generate the new Markdown file
    md_content = "# 🔥 HEARTH Contributors Leaderboard 🔥\n\n"
    md_content += "Everyone listed below has submitted ideas that have been added to HEARTH. This list is automatically generated and updated monthly. Thank you for stoking the fire that warms our community!\n\n"
    md_content += "| Rank | Contributor | Hunts Submitted |\n"
    md_content += "|------|-------------|-----------------|\n"

    for i, (name, count) in enumerate(sorted_contributors):
        md_content += f"| {i+1} | {name} | {count} |\n"

    # Overwrite the existing file
    leaderboard_path = Path("Keepers/Contributors.md")
    leaderboard_path.write_text(md_content)
    print("✅ Successfully generated new Contributors.md")

if __name__ == "__main__":
    generate_leaderboard() 