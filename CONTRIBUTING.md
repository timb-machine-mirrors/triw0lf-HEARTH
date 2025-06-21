# Contributing to HEARTH

Thank you for your interest in contributing to HEARTH! This document provides guidelines for submitting new threat hunting hypotheses.

## 🔥 Submitting a New Hunt

HEARTH offers two ways to submit new hunt hypotheses:

### Option 1: Automated CTI Submission (Recommended)

Our automated system generates threat hunting hypotheses from Cyber Threat Intelligence (CTI). Here's how to submit:

#### Quick Start

1. **Go to the [HEARTH Issues page](https://github.com/THORCollective/HEARTH/issues)**
2. **Click "New issue"**
3. **Select "🔥 HEARTH CTI Submission"** from the template options
4. **Fill out the form:**
   - **Title**: Use a descriptive name (e.g., "CTI Submission: [Threat Actor Name]")
   - **CTI Content**: Either paste the threat intelligence text directly OR upload a file (PDF, TXT, etc.)
   - **Link to Original Source**: Provide the URL to the original report/article (optional but recommended)
5. **Submit the issue**

#### What Happens Next

Our automated system will:
- Generate a hunt hypothesis from your CTI
- Create a draft pull request with the new hunt
- Add the source link to the references
- Place the hunt in the `Flames/` directory with the next available hunt ID

### Option 2: Manual Hunt Submission

If you prefer to write your own hunt hypothesis from scratch:

1. **Create a new markdown file** in the `Flames/` directory
2. **Use the naming convention**: `H-YYYY-XXX.md` (e.g., `H-2025-001.md`)
3. **Follow the hunt template structure** (see existing files in `Flames/` for examples)
4. **Submit a pull request** with your new hunt file

#### Hunt File Structure

Each hunt should include:
- **Hunt ID**: `# H-YYYY-XXX`
- **Hypothesis**: Specific, actionable threat hunting hypothesis
- **Metadata table**: Including tactic, technique, tags, and submitter info
- **Why section**: Explanation of why this hunt is important
- **References**: Links to MITRE ATT&CK techniques and source materials

### Tips for Better Submissions

- **Be specific**: Include technical details about the threat actor's behavior
- **Include context**: Provide background on the campaign or malware family
- **Cite sources**: Always include links to the original CTI reports
- **Focus on one technique**: Each hunt should target a single MITRE ATT&CK technique

### Review Process

1. For automated submissions: The system creates a draft pull request
2. For manual submissions: Create your own pull request
3. Reviewers will assess the hunt hypothesis
4. Feedback and improvements may be requested
5. Once approved, the hunt is merged into the main repository

## Other Ways to Contribute

- **Review pull requests**: Help improve existing hunt hypotheses
- **Report issues**: Let us know about bugs or improvements needed
- **Suggest enhancements**: Propose new features or workflow improvements
- **Share feedback**: Tell us how HEARTH is being used in your organization

## Questions?

If you have questions about contributing, feel free to:
- Open a general issue in the repository
- Check existing discussions in the Issues section
- Review the [HEARTH documentation](https://github.com/THORCollective/HEARTH)

Thank you for helping make HEARTH better for the threat hunting community! 