1. MITRE ATT&CK Technique:
   - T1190: Exploit Public-Facing Application

2. Hypothesis: Cyber adversaries are exploiting vulnerabilities in public-facing Confluence servers to gain unauthorized access.

---

# CONFLLUENCE-DFIRREPORT
Cyber adversaries are exploiting vulnerabilities in public-facing Confluence servers to gain unauthorized access.

| Hunt #       | Idea / Hypothesis                                                      | Tactic         | Notes                                      | Tags                           | Submitter                                   |
|--------------|-------------------------------------------------------------------------|----------------|--------------------------------------------|--------------------------------|---------------------------------------------|
| CONFLLUENCE-DFIRREPORT    | Cyber adversaries are exploiting vulnerabilities in public-facing Confluence servers to gain unauthorized access. | Initial Access | Based on ATT&CK technique T1190, using known vulnerability CVE-2023-22527. | #InitialAccess #T1190 #ExploitPublicFacingApplication | [hearth-auto-intel](https://github.com/THORCollective/HEARTH) |

## Why
- Identifying this malicious activity is critical as it signifies the initial stage of a potential multi-stage attack. If undetected and unaddressed, it can lead to further network exploitation.
- Successful execution of this attack provides threat actors with a foothold in the network, facilitating additional malicious activities such as lateral movement, data exfiltration, and ransomware deployment.
- This behavior is often associated with broader campaigns where cyber adversaries target multiple organizations using the same exploit, resulting in widespread breaches and substantial financial and reputational damage.

## References
- [MITRE ATT&CK technique T1190](https://attack.mitre.org/techniques/T1190/)
- [Source CTI report link]