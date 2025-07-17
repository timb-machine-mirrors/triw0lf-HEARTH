#!/usr/bin/env python3
"""
THOR Collective HEARTH - Notebook generator integration script.
This script adapts HEARTH hunt data to work with the threat-hunting-notebook-generator.
"""

import json
import sys
import os
from pathlib import Path
from typing import Dict, Any
import tempfile
import subprocess

def convert_hunt_to_article(hunt_data: Dict[str, Any]) -> str:
    """Convert HEARTH hunt data to article format for notebook generation."""
    
    article_content = f"""# {hunt_data.get('title', 'Unknown Hunt')}

## Hunt Information
- **Hunt ID**: {hunt_data.get('id', 'Unknown')}
- **Category**: {hunt_data.get('category', 'Unknown')}
- **Tactic**: {hunt_data.get('tactic', 'Unknown')}
- **Submitter**: {hunt_data.get('submitter', 'Unknown')}
- **Source**: THOR Collective HEARTH Database
- **Database**: https://hearth.thorcollective.com

## Hypothesis
{hunt_data.get('hypothesis', 'No hypothesis provided')}

## Why This Hunt Matters
{hunt_data.get('why', 'No explanation provided')}

## Tags
{', '.join(hunt_data.get('tags', []))}

## References
{hunt_data.get('references', 'No references provided')}

## Threat Intelligence Context
This hunt is designed to detect potential threats based on the hypothesis: "{hunt_data.get('hypothesis', 'No hypothesis provided')}"

The hunt focuses on the {hunt_data.get('tactic', 'Unknown')} tactic and can be used to identify suspicious activities in your environment.

## Data Sources
Common data sources for this type of hunt include:
- Security event logs
- Network traffic logs
- Endpoint detection and response (EDR) logs
- Authentication logs
- Process execution logs

## Detection Approach
This hunt can be implemented using various detection approaches:
1. **Signature-based detection**: Look for specific indicators of compromise
2. **Behavioral analysis**: Identify unusual patterns in normal operations
3. **Statistical analysis**: Use baseline analysis to identify anomalies
4. **Machine learning**: Apply algorithmic detection methods

## Expected Outcomes
Successful execution of this hunt should help:
- Identify potential security threats
- Validate security controls
- Improve threat detection capabilities
- Provide actionable intelligence for response teams

## About THOR Collective HEARTH
This hunt was generated from the THOR Collective HEARTH (Hunting Exchange and Research Threat Hub) database - a community-driven, open-source platform for sharing threat hunting hypotheses and methodologies.

Visit https://hearth.thorcollective.com to explore more hunts and contribute to the community.
"""
    
    return article_content

def generate_notebook_from_hunt(hunt_data: Dict[str, Any], output_path: str) -> bool:
    """Generate a Jupyter notebook from HEARTH hunt data."""
    
    try:
        # Create temporary article file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as tmp_file:
            article_content = convert_hunt_to_article(hunt_data)
            tmp_file.write(article_content)
            tmp_file_path = tmp_file.name
        
        # Prepare the notebook generator command
        notebook_gen_path = Path(__file__).parent.parent.parent / "threat-hunting-notebook-generator"
        
        if not notebook_gen_path.exists():
            print(f"Error: Notebook generator not found at {notebook_gen_path}")
            return False
        
        # Run the notebook generator
        cmd = [
            sys.executable, "-m", "src.main",
            "--input", tmp_file_path,
            "--output", output_path,
            "--verbose"
        ]
        
        result = subprocess.run(cmd, cwd=notebook_gen_path, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"Successfully generated notebook: {output_path}")
            print(result.stdout)
            return True
        else:
            print(f"Error generating notebook: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"Exception during notebook generation: {e}")
        return False
    finally:
        # Clean up temporary file
        if 'tmp_file_path' in locals():
            try:
                os.unlink(tmp_file_path)
            except:
                pass

def main():
    """Main function for notebook generation."""
    
    if len(sys.argv) < 2:
        print("Usage: python notebook_generator.py <hunt_data_json>")
        sys.exit(1)
    
    try:
        # Parse hunt data from command line argument
        hunt_data_json = sys.argv[1]
        hunt_data = json.loads(hunt_data_json)
        
        # Generate output filename
        hunt_id = hunt_data.get('id', 'unknown')
        output_filename = f"{hunt_id}_threat_hunting_notebook.ipynb"
        output_path = Path.cwd() / "generated_notebooks" / output_filename
        
        # Create output directory
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Generate notebook
        success = generate_notebook_from_hunt(hunt_data, str(output_path))
        
        if success:
            print(f"SUCCESS: Generated notebook at {output_path}")
            # Output the path for GitHub Actions to use
            print(f"NOTEBOOK_PATH={output_path}")
            sys.exit(0)
        else:
            print("FAILED: Could not generate notebook")
            sys.exit(1)
            
    except json.JSONDecodeError as e:
        print(f"Error parsing hunt data JSON: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()