# Threat Hunting Report - PEAK Framework

## Hunt ID: `H/B/M-XXXX`
*(H for Hypothesis-driven, B for Baseline, M for Model-Assisted)*

## Hunt Title:
*A concise, descriptive name for this hunt.*

---

## ** PREPARE: Define the Hunt**
### **Hypothesis**
> *What are you hunting for and why?*  
> *Example: Attackers who have gained initial access might attempt to escalate privileges using unusual `sudo` or `pkexec` commands.*

### **Threat Intel & Research**
- **MITRE ATT&CK Techniques:**  
  - `Txxxx - Technique Name`
- **Related Reports, Blogs, or Threat Intel Sources:**  
  - `[Link]`
  - `[Reference]`
- **Historical Prevalence & Relevance:**  
  - *(Has this been observed before in your environment?)*

### **Data Requirements**
*(List the log sources, fields, and data types needed to execute the hunt.)*
- **Log Sources:**  
  - `sysmon`, `linux:audit`, `firewall logs`, etc.
- **Key Fields Needed:**  
  - `process_name`, `command_line`, `user`, `parent_process`, etc.

---

## **EXECUTE: Run the Hunt**
### **Hunting Query**
*(Provide Splunk, Sigma, KQL, or another query language to execute the hunt.)*
SPL:
index=main sourcetype=linux:audit
| search "sudo" OR "pkexec"
| stats count by user, command, parent_process

### Visualization or Analytics
*(Describe any dashboards, anomaly detection methods, or visualizations used.)*

### Detection Logic
*(How would this be turned into a detection rule? Thresholds, tuning considerations, etc.)*

---

## ACT: Findings & Response

### Findings
**Observed Activity:**  
*(Summarize key results, including any unusual activity.)*

**False Positives:**  
*(What normal behavior did you see that could trigger similar alerts? How can this be tuned?)*

### Next Steps & Mitigation  
*(What actions should defenders take if malicious activity is confirmed?)*

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
