#!/usr/bin/env python3
"""
Script to parse HEARTH hunt markdown files and generate JSON data for the web interface.
"""

import os
import re
import json
from pathlib import Path

def parse_markdown_file(file_path, category):
    """Parse a single markdown hunt file and extract relevant data."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        hunt_id = file_path.stem
        if hunt_id.lower() == 'secret':
            return None
        
        # Find the table header row - be more flexible with variations
        lines = content.split('\n')
        table_start = None
        for i, line in enumerate(lines):
            # Look for variations of the header: "Hunt", "Idea" or "Hypothesis", "Tactic", "Notes", "Tags", "Submitter"
            if ('Hunt' in line and 
                ('Idea' in line or 'Hypothesis' in line) and 
                'Tactic' in line and 
                'Notes' in line and 
                'Tags' in line and 
                'Submitter' in line):
                table_start = i
                break
        
        if table_start is not None and table_start + 2 < len(lines):
            data_row = lines[table_start + 2]
            cells = [cell.strip() for cell in data_row.split('|') if cell.strip()]
            # The columns are: Hunt #, Idea/Hypothesis, Tactic, Notes, Tags, Submitter
            if len(cells) >= 6:
                hunt_id_from_table = cells[0]
                idea = cells[1]
                tactic = cells[2]
                notes = cells[3]
                tags = cells[4]
                submitter = cells[5]
            else:
                hunt_id_from_table = hunt_id
                idea = ''
                tactic = ''
                notes = ''
                tags = ''
                submitter = ''
        else:
            hunt_id_from_table = hunt_id
            idea = ''
            tactic = ''
            notes = ''
            tags = ''
            submitter = ''
        
        # Clean up extracted data
        hunt_id_from_table = hunt_id_from_table.replace('**', '').strip()
        idea = idea.replace('**', '').strip()
        tactic = tactic.replace('**', '').strip()
        notes = notes.replace('**', '').strip()
        tags = tags.replace('**', '').strip()
        submitter = submitter.replace('**', '').strip()
        
        # Parse tags as array (remove #, split by space)
        tag_list = [t.lstrip('#') for t in tags.split() if t.startswith('#')]
        
        # Parse submitter
        submitter_name = ''
        submitter_link = ''
        if submitter:
            link_match = re.search(r'\[([^\]]+)\]\(([^)]+)\)', submitter)
            if link_match:
                submitter_name = link_match.group(1)
                submitter_link = link_match.group(2)
            else:
                submitter_name = submitter.strip()
        
        # Extract Why section
        why_match = re.search(r'## Why\s*\n(.*?)(?=\n##|\n$)', content, re.MULTILINE | re.DOTALL)
        why_section = why_match.group(1).strip() if why_match else ''
        
        # Extract References section
        ref_match = re.search(r'## References\s*\n(.*?)(?=\n##|\n$)', content, re.MULTILINE | re.DOTALL)
        ref_section = ref_match.group(1).strip() if ref_match else ''
        
        return {
            "id": hunt_id_from_table,
            "category": category,
            "title": idea,
            "tactic": tactic,
            "notes": notes,
            "tags": tag_list,
            "submitter": {
                "name": submitter_name,
                "link": submitter_link
            },
            "why": why_section,
            "references": ref_section,
            "file_path": str(file_path.relative_to(Path(__file__).parent.parent))
        }
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        return None

def main():
    """Main function to parse all hunt files and generate JSON."""
    base_dir = Path(__file__).parent.parent
    categories = ['Flames', 'Embers', 'Alchemy']
    
    all_hunts = []
    
    for category in categories:
        category_dir = base_dir / category
        if category_dir.exists():
            print(f"Processing {category}...")
            
            for md_file in category_dir.glob('*.md'):
                hunt_data = parse_markdown_file(md_file, category)
                if hunt_data:
                    all_hunts.append(hunt_data)
                    print(f"  Parsed {hunt_data['id']}")
    
    # Sort hunts by ID
    all_hunts.sort(key=lambda x: x['id'])
    
    # Generate JSON file
    output_file = base_dir / 'hunts-data.js'
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('// Auto-generated hunt data from markdown files\n')
        f.write('const HUNTS_DATA = ')
        json.dump(all_hunts, f, indent=2, ensure_ascii=False)
        f.write(';\n')
    
    print(f"\nGenerated {output_file} with {len(all_hunts)} hunts")
    
    # Print statistics
    print("\nStatistics:")
    for category in categories:
        count = len([h for h in all_hunts if h['category'] == category])
        print(f"  {category}: {count} hunts")
    
    # Print unique tactics
    tactics = set()
    for hunt in all_hunts:
        if hunt['tactic']:
            tactics.update([t.strip() for t in hunt['tactic'].split(',')])
    
    print(f"\nUnique tactics: {len(tactics)}")
    for tactic in sorted(tactics):
        print(f"  - {tactic}")
    
    # Print unique tags
    all_tags = set()
    for hunt in all_hunts:
        all_tags.update(hunt['tags'])
    
    print(f"\nUnique tags: {len(all_tags)}")
    for tag in sorted(all_tags):
        print(f"  - #{tag}")

if __name__ == "__main__":
    main() 