# Static Design Validation

Status: PASS for the checks below. These are offline design checks, not Cisco IOS or Packet Tracer execution.

- 17 configured interface addresses are unique.
- All three WAN links have correctly paired /30 endpoints and matching configured costs.
- Every HQ routed VLAN exists on SW-HQ and has the matching router subinterface.
- All three OSPF processes use passive-interface default.
- Clinical, Biomedical, Admin, Guest and Server ingress ACL attachments exist.
- Abstract HQ-to-Clinic WAN cost is 10 normally and 100 after the direct link is removed.
- Removing either backup link alone leaves the primary WAN cost at 10.

Not checked: parser acceptance on the installed Packet Tracer version; actual forwarding; ACL counter behavior; DHCP; server GUI settings; convergence; SSH RSA prompts; NTP and syslog runtime behavior.

Run the Packet Tracer test matrix and record actual evidence before claiming a completed project.
