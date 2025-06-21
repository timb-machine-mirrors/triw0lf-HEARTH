import os
import re
import requests
from bs4 import BeautifulSoup
import PyPDF2
import docx
import io

def get_cti_content(url):
    """
    Downloads and extracts text content from a given URL.
    Supports HTML, PDF, and DOCX formats.
    """
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        content_type = response.headers.get('content-type', '')

        if 'pdf' in content_type:
            with io.BytesIO(response.content) as f:
                reader = PyPDF2.PdfReader(f)
                text = "".join(page.extract_text() for page in reader.pages)
            return text
        elif 'vnd.openxmlformats-officedocument.wordprocessingml.document' in content_type:
            with io.BytesIO(response.content) as f:
                doc = docx.Document(f)
                text = "\n".join([para.text for para in doc.paragraphs])
            return text
        else:
            soup = BeautifulSoup(response.content, 'html.parser')
            for script_or_style in soup(["script", "style"]):
                script_or_style.decompose()
            return " ".join(soup.stripped_strings)

    except requests.exceptions.RequestException as e:
        return f"Error fetching URL: {e}"
    except Exception as e:
        return f"Error processing content: {e}"

def update_github_issue(issue_number, new_body):
    """
    Updates the body of a GitHub issue.
    """
    token = os.getenv('GITHUB_TOKEN')
    repo = os.getenv('GITHUB_REPOSITORY')
    if not (token and repo):
        print("Missing GITHUB_TOKEN or GITHUB_REPOSITORY env variables.")
        return

    url = f"https://api.github.com/repos/{repo}/issues/{issue_number}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    data = {"body": new_body}
    response = requests.patch(url, json=data, headers=headers)
    
    if response.status_code == 200:
        print(f"Successfully updated issue #{issue_number}.")
    else:
        print(f"Failed to update issue #{issue_number}. Status: {response.status_code}, Response: {response.text}")

def main():
    issue_body = os.getenv('ISSUE_BODY')
    issue_number = os.getenv('ISSUE_NUMBER')
    
    if not issue_body or not issue_number:
        print("Missing ISSUE_BODY or ISSUE_NUMBER env variables.")
        return

    # Find the URL in the issue body
    url_match = re.search(r'### Link to Original Source\s*\n\s*(https?://[^\s]+)', issue_body)
    if not url_match:
        print("No CTI link found in the issue body.")
        return

    cti_url = url_match.group(1).strip()
    print(f"Processing CTI link: {cti_url}")

    # Check if the content has already been added
    if "*(This will be processed automatically by our system. Please leave this section as is.)*" not in issue_body:
        print("Content already processed. Skipping.")
        return

    content = get_cti_content(cti_url)
    
    if "Error" in content:
        final_content = f"### CTI Content\n\nFailed to retrieve or process content from the URL.\n\n**Details:**\n```\n{content}\n```"
    else:
        final_content = f"### CTI Content\n\n```\n{content[:15000]}\n```\n*Content was automatically extracted from the source.*"
    
    # Replace the placeholder text with the fetched content
    new_issue_body = re.sub(
        r'### CTI Content\s*\n\s*\*\(This will be processed automatically by our system\. Please leave this section as is\.\)\*',
        final_content,
        issue_body
    )

    if new_issue_body != issue_body:
        update_github_issue(issue_number, new_issue_body)

if __name__ == "__main__":
    main() 