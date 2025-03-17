# Threat Hunting Report - PEAK Framework

## Hunt ID: `H/B/M-XXXX`
*(H for Hypothesis-driven, B for Baseline, M for Model-Assisted)*

## Hunt Title:
*A concise, descriptive name for this hunt.*

---

## ** PREPARE: Define the Hunt**
### **Hypothesis**
> *What are you hunting for and why?*  
> *Example: Attackers are escalating privileges using unusual `sudo` or `pkexec` commands on Linux hosts in your environment.*

### **Threat Intel & Research**
- **MITRE ATT&CK Techniques:**  
  - `Txxxx - Technique Name`
- **Related Reports, Blogs, or Threat Intel Sources:**  
  - `[Link]`
  - `[Reference]`
- **Historical Prevalence & Relevance:**  
  - *(Has this been observed before in your environment? Are there any detections/mitigations for this activity already in place?)*
 
## Scoping with the ABLE Methodology

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

---

## EXECUTE: Run the Hunt

### Hunting Queries
*(Document queries for Splunk, Sigma, KQL, or another query language to execute the hunt. Capture any adjustments made during analysis and iterate on findings.)*

#### Initial Query
index=main sourcetype=linux:audit  
| search "sudo" OR "pkexec"  
| stats count by user, command, parent_process  

- **Notes:**  
  - Did this query return expected results?  
  - Were there false positives or gaps?  
  - How did you refine the query based on findings?  

#### Refined Query (if applicable)
index=main sourcetype=linux:audit  
| search "sudo" OR "pkexec"  
| stats count by user, command, parent_process, _time  
| sort - _time  

- **Rationale for Refinement:**  
  - Added `_time` for better event sequencing.  
  - Applied `sort` to identify patterns in privilege escalation attempts.  

### Visualization or Analytics
*(Describe any dashboards, anomaly detection methods, or visualizations used. Capture observations and note whether visualizations revealed additional insights.)*  

- **Examples:**  
  - Time-series charts to detect activity spikes  
  - Process lineage graphs to visualize parent-child process relationships  
  - Heatmaps of unusual user activity  

### Detection Logic
*(How would this be turned into a detection rule? Thresholds, tuning considerations, etc.)*  

- **Initial Detection Criteria:**  
  - What conditions would trigger an alert?  
  - Are there threshold values that indicate malicious activity?  

- **Refinements After Review:**  
  - Did certain legitimate activities cause false positives?  
  - How can you tune the rule to focus on real threats?  

- **Final Detection Rule (if applicable):**  
index=main sourcetype=linux:audit  
| search "sudo" OR "pkexec"  
| stats count by user, command, parent_process  
| where count > 3  # Adjusted threshold based on observed normal behavior  

### Capturing Your Analysis & Iteration
- **Summarize insights gained from each query modification and visualization.**  
- **Reiterate key findings:**  
  - Did this query lead to a confirmed detection, a false positive, or a hypothesis for further hunting?  
  - If this hunt were repeated, what changes should be made?  
  - Does this hunt generate ideas for additional hunts?  

- **Document next steps for refining detection rules or automation.**  

---

## ACT: Findings & Response

### Findings
**Observed Activity:**  
*(Summarize key results, including any unusual activity.)*

**False Positives:**  
*(What normal behavior did you see that could trigger similar alerts? How can this be tuned?)*

### Next Steps & Mitigation  
*(What actions should defenders take if malicious activity is confirmed?)*

## Outputs
*(Summarize the outputs of the query: counts, trends, anomalies, correlations, or pivots.)*

- **Observed Trends:**  
- **Unexpected Findings:**  
- **Noteworthy Patterns:**  
- **Key Data Correlations:**  

#### **Mitigation Recommendations:**  
- [ ] Disable vulnerable service  
- [ ] Investigate impacted hosts  

#### **Detection Engineering:**  
- [ ] Refine search logic, add alerts  

#### **Response Playbooks:**  
- [ ] Reference relevant IR playbooks  

---

## KNOWLEDGE: Lessons Learned & Documentation

### Adjustments to Future Hunts
- **What worked well?**  
- **What could be improved?**  
- **Should this hunt be automated as a detection?**  

### References & Documentation  
*(Links to related hunts, detections, or threat intelligence reports.)*  

- [Link]  
- [Reference]  
