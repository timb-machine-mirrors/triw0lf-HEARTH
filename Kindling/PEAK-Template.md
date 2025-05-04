# Threat Hunting Report - PEAK Framework

## Hunt ID: `H/B/M-XXXX`
*(H for Hypothesis-driven, B for Baseline, M for Model-Assisted)*

## Hunt Title:
*A concise, descriptive name for this hunt.*

---

## PREPARE: Define the Hunt

| **Hunt Information**            | **Details** |
|----------------------------------|-------------|
| **Hypothesis**                  | [What are you hunting for and why?] |
| **Threat Hunter Name**          | [Name of the threat hunter] |
| **Date**                        | [Date of hunt] |
| **Requestor**                   | [Person or team requesting the hunt] |
| **Timeframe for hunt**          | [Expected duration for the hunt] |

## Scoping with the ABLE Methodology (Use the table below)

- **A - Actor**: (OPTIONAL) Identify the threat actor involved with the behavior.  
  - *Example: APT28 (Fancy Bear), APT29 (Cozy Bear)

- **B - Behaviors**: Describe the actions observed, including tactics, techniques, and procedures (TTPs).  
  - *Example: The actor attempted credential dumping using `mimikatz.exe` (T1003).*

- **L - Location**: Specify where the activity occurred, such as an endpoint, network segment, or cloud environment.  
  - *Example: The behavior was detected on `WIN-DC01`, a domain controller within the internal network.*
  - *Example: The attacker leveraged AWS IAM roles to escalate privileges in the cloud environment.*

- **E - Evidence**: List supporting logs, artifacts, and forensic data used for validation.  
  - *Example: Windows Event Log ID 4625 (failed login) and 4624 (successful login) correlated with VPN logs.*  
    - **Key Fields:** `user`, `source_ip`, `destination_ip`, `event_id`, `timestamp`  
  - *Example: Zeek logs captured suspicious DNS requests to `maliciousdomain.com` followed by outbound C2 traffic.*  
    - **Key Fields:** `query`, `query_type`, `response_code`, `client_ip`, `server_ip`  
  - *Example: Sysmon Event ID 1 (process creation) showed execution of `rundll32.exe` loading a suspicious DLL.*  
    - **Key Fields:** `process_name`, `command_line`, `parent_process`, `hash`, `user`  
  - *Example: CloudTrail logs revealed unauthorized API calls for privilege escalation in AWS.*  
    - **Key Fields:** `event_name`, `user_identity.arn`, `source_ip_address`, `request_parameters`, `response_elements`  

## ABLE Table:
| **Field**       | **Description**                                             | **Example**                                |
|-----------------|-------------------------------------------------------------|--------------------------------------------|
| **Actor**   | The threat actor involved or suspected                      | [Insert threat actor (if applicable)]                         |
| **Behavior**    | Observed or expected actions, TTPs, or suspicious patterns  | [Insert behavior]                          |
| **Location**    | Where the behavior occurred (endpoint, network, cloud, etc.)| [Where this behavior is expected or found] |
| **Evidence**    | What the behavior looks like in the events.            | [Evidence of behavior]  |

## Related Tickets (detection coverage, previous incidents, etc.)

| **Role**                        | **Ticket and Other Details** |
|----------------------------------|------------------------------|
| **SOC/IR**                      | [Insert related ticket or incident details] |
| **Threat Intel (TI)**            | [Insert related ticket or incident details] |
| **Detection Engineering (DE)**   | [Insert related ticket or incident details] |
| **Red Team / Pen Testing**       | [Insert related ticket or incident details] |
| **Other**                        | [Insert related ticket or incident details] |

## **Threat Intel & Research**
- **MITRE ATT&CK Techniques:**  
  - `Txxxx - Technique Name`
- **Related Reports, Blogs, or Threat Intel Sources:**  
  - `[Link]`
  - `[Reference]`
- **Historical Prevalence & Relevance:**  
  - *(Has this been observed before in your environment? Are there any detections/mitigations for this activity already in place?)*
 
---

## EXECUTE: Run the Hunt

### Hunting Queries
*(Document queries for Splunk, Sigma, KQL, or another query language to execute the hunt. Capture any adjustments made during analysis and iterate on findings.)*

#### Initial Query
`index=main sourcetype=linux:audit "sudo" OR "pkexec"  
| stats count by user, command, parent_process `

- **Notes:**  
  - Did this query return expected results?  
  - Were there false positives or gaps?  
  - How did you refine the query based on findings?  

#### Refined Query (if applicable)
`index=main sourcetype=linux:audit "sudo" OR "pkexec"  
| stats count by user, command, parent_process, _time  
| sort - _time `

- **Rationale for Refinement:**  
  - Added `_time` for better event sequencing.  
  - Applied `sort` to identify patterns in privilege escalation attempts.  

### Visualization or Analytics
*(Describe any dashboards, anomaly detection methods, or visualizations used. Capture observations and note whether visualizations revealed additional insights.)*  

- **Examples:**  
  - Time-series charts to detect activity spikes  
  - Heatmaps of unusual application installs  

### Detection Logic
*(How would this be turned into a detection rule? Thresholds, tuning considerations, etc.)*  

- **Initial Detection Criteria:**  
  - What conditions would trigger an alert?  
  - Are there threshold values that indicate malicious activity?  

- **Refinements After Review:**  
  - Did certain legitimate activities cause false positives?  
  - How can you tune the rule to focus on real threats?  

### Capturing Your Analysis & Iteration
- **Summarize insights gained from each query modification and visualization.**  
- **Reiterate key findings:**  
  - Did this query lead to any findings, false positives, or hypotheses for further hunting?  
  - If this hunt were repeated, what changes should be made?  
  - Does this hunt generate ideas for additional hunts?  

- **Document the next steps for refining queries for detections and other outputs.**  

---

## ACT: Findings & Response

### Hunt Review Template

### **Hypothesis / Topic**
*(Restate the hypothesis and topic of the investigation.)*

### **Executive Summary**
**Key Points:**  
- 3-5 sentences summarizing the investigation.  
- Indicate whether the hypothesis was proved or disproved.  
- Summarize the main findings (e.g., "We found..., we did not find..., we did not find... but we did find...").  

### **Findings**
*(Summarize key results, including any unusual activity.)*
| **Finding** | **Ticket Number and Link** | **Description** |
|------------|----------------------------|-----------------|
| [Describe finding] | [Insert Ticket Number] | [Brief description of the finding, such as suspicious activity, new detection idea, data gap, etc.] |
| [Describe finding] | [Insert Ticket Number] | [Brief description of the finding] |
| [Describe finding] | [Insert Ticket Number] | [Brief description of the finding] |

## K - Knowledge: Lessons Learned & Documentation

### **Adjustments to Future Hunts**
- **What worked well?**  
- **What could be improved?**  
- **Should this hunt be automated as a detection?**  
- **Are there any follow-up hunts that should be conducted?**  
- **What feedback should be shared with other teams (SOC, IR, Threat Intel, Detection Engineering, etc.)?**

### **Sharing Knowledge & Documentation**
*(Ensure insights from this hunt are shared with the broader security team to improve future hunts and detections.)*  

- **Knowledge Base (KB) Articles**  
  - [ ] Write an internal KB article summarizing findings and recommended detection improvements.  
  - [ ] Document any new hunting methodologies developed.  

- **Threat Hunt Readouts**  
  - [ ] Schedule a readout with SOC, IR, and Threat Intel teams.  
  - [ ] Present key findings and suggested improvements to detections.  

- **Reports & External Sharing**  
  - [ ] Publish findings in an internal hunt report.  
  - [ ] Share relevant insights with stakeholders, vendors, or industry communities if applicable.  

### **References**
- [Insert link to related documentation, reports, or sources]  
- [Insert link to any external references or articles]  
