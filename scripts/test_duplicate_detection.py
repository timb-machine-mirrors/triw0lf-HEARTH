#!/usr/bin/env python3
"""
Test script for duplicate detection functionality.
This script tests the duplicate detection without requiring the full environment.
"""

import sys
import os
from pathlib import Path

# Add the current directory to the path so we can import our modules
sys.path.insert(0, str(Path(__file__).parent))

def test_duplicate_detection():
    """Test the duplicate detection functionality."""
    
    # Test hunt content
    test_hunt = """
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
    
    try:
        from duplicate_detection import check_duplicates_for_new_submission
        
        print("🔍 Testing duplicate detection...")
        result = check_duplicates_for_new_submission(test_hunt, "test-hunt.md")
        print("✅ Duplicate detection test completed successfully!")
        print("\n" + "="*50)
        print("DUPLICATE DETECTION RESULT:")
        print("="*50)
        print(result)
        print("="*50)
        
    except ImportError as e:
        print(f"❌ Could not import duplicate detection module: {e}")
        print("This is expected if the required dependencies are not installed.")
    except Exception as e:
        print(f"❌ Error during duplicate detection test: {e}")

if __name__ == "__main__":
    test_duplicate_detection() 