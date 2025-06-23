# Duplicate Detection System

## Overview

The duplicate detection system uses AI to automatically compare new hunt submissions against existing hunts to identify potential duplicates or high-similarity submissions. This helps maintain quality and reduce redundancy in the HEARTH project.

## How It Works

### 1. Hunt Analysis
When a new hunt is submitted (either via CTI link or manual submission), the system:

1. **Extracts key information** from the new hunt:
   - Hypothesis (the core behavioral statement)
   - MITRE ATT&CK tactic
   - Tags and metadata
   - Content context

2. **Scans existing hunts** from all directories:
   - `Flames/` (active hunts)
   - `Embers/` (draft hunts)
   - `Alchemy/` (experimental hunts)

3. **Performs AI-powered comparison** using GPT-4 to analyze:
   - Conceptual similarity (same core technique or behavior)
   - Technical similarity (same tools, commands, or methods)
   - Target similarity (same systems, services, or data)
   - Tactical similarity (same MITRE ATT&CK technique)

### 2. Similarity Scoring

The AI assigns similarity scores (0-100) and recommendations:

- **0-50**: Unique submission
- **51-79**: Moderate similarity (review recommended)
- **80-100**: High similarity (potential duplicate)

### 3. Automated Feedback

The system automatically posts a detailed comment on the GitHub issue with:

- **Overall assessment** of the submission
- **Detailed comparisons** with similar existing hunts
- **Similarity scores** and explanations
- **Recommendations** for approval or review

## Integration Points

### GitHub Actions Workflow
The duplicate detection is integrated into the `issue-generate-hunts.yml` workflow:

1. **Triggered** when a new hunt is generated from an issue
2. **Runs automatically** after hunt generation
3. **Posts results** in the issue comment for review

### Manual Testing
You can test the duplicate detection locally:

```bash
cd scripts/
python test_duplicate_detection.py
```

## Configuration

### Environment Variables
- `OPENAI_API_KEY`: Required for AI analysis
- Other variables are inherited from the main workflow

### Customization
You can modify the similarity threshold and analysis parameters in `duplicate_detection.py`:

- `threshold=0.7`: Minimum similarity score to flag
- `max_tokens=2000`: Maximum tokens for AI analysis
- Hunt comparison limits for performance

## Output Format

The duplicate detection generates structured comments like:

```
🔍 Duplicate Detection Results

Overall Assessment: This hunt appears to be unique and focuses on a specific technique not covered in existing hunts.

Similar Existing Hunts:

🟢 H-2024-001.md (Similarity: 25%)
   - Status: LOW SIMILARITY (UNIQUE)
   - Explanation: Different techniques and targets

✅ Recommendation: This hunt appears unique and can be approved.

---
This analysis was performed by AI duplicate detection. Please review manually before making final decisions.
```

## Benefits

1. **Quality Control**: Prevents redundant submissions
2. **Efficiency**: Reduces manual review time
3. **Consistency**: Ensures diverse hunt coverage
4. **Transparency**: Provides clear reasoning for decisions
5. **Learning**: Helps contributors understand what makes a hunt unique

## Limitations

- **AI Dependency**: Requires OpenAI API access
- **Context Window**: Limited to recent hunts for performance
- **False Positives**: May flag similar but distinct techniques
- **Manual Review**: Final decisions still require human oversight

## Future Enhancements

- **Fuzzy Matching**: Improve text similarity algorithms
- **Semantic Analysis**: Better understanding of hunt intent
- **Feedback Loop**: Learn from manual corrections
- **Performance Optimization**: Cache analysis results
- **Custom Models**: Fine-tuned models for hunt analysis 