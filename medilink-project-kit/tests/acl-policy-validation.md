# Offline ACL Policy Checks

PASS: 57 test cases evaluated against the generated named ACL text.

This independent simplified checker evaluates first-match IPv4/protocol/address/port matching, ICMP echo types, and TCP ACK/RST matching used in these configurations. It is not a Cisco IOS parser, Packet Tracer engine, stateful firewall test, or forwarding test.

- PASS: CLINICAL-IN, DHCP discover, expected permit
- PASS: CLINICAL-IN, DNS UDP, expected permit
- PASS: CLINICAL-IN, DNS TCP, expected permit
- PASS: CLINICAL-IN, NTP, expected permit
- PASS: CLINICAL-IN, Authorized HTTP, expected permit
- PASS: CLINICAL-IN, Wrong HTTP application, expected deny
- PASS: CLINICAL-IN, Gateway diagnostic, expected permit
- PASS: CLINICAL-IN, SSH to NOC router, expected deny
- PASS: CLINICAL-IN, Cross-zone ICMP, expected deny
- PASS: CLINICAL-IN, Spoofed source HTTP, expected deny
- PASS: BIOMEDICAL-IN, DHCP discover, expected permit
- PASS: BIOMEDICAL-IN, DNS UDP, expected permit
- PASS: BIOMEDICAL-IN, DNS TCP, expected permit
- PASS: BIOMEDICAL-IN, NTP, expected permit
- PASS: BIOMEDICAL-IN, Authorized HTTP, expected permit
- PASS: BIOMEDICAL-IN, Wrong HTTP application, expected deny
- PASS: BIOMEDICAL-IN, Gateway diagnostic, expected permit
- PASS: BIOMEDICAL-IN, SSH to NOC router, expected deny
- PASS: BIOMEDICAL-IN, Cross-zone ICMP, expected deny
- PASS: BIOMEDICAL-IN, Spoofed source HTTP, expected deny
- PASS: ADMIN-IN, DHCP discover, expected permit
- PASS: ADMIN-IN, DNS UDP, expected permit
- PASS: ADMIN-IN, DNS TCP, expected permit
- PASS: ADMIN-IN, NTP, expected permit
- PASS: ADMIN-IN, Authorized HTTP, expected permit
- PASS: ADMIN-IN, Wrong HTTP application, expected deny
- PASS: ADMIN-IN, Gateway diagnostic, expected permit
- PASS: ADMIN-IN, SSH to NOC router, expected deny
- PASS: ADMIN-IN, Cross-zone ICMP, expected deny
- PASS: ADMIN-IN, Spoofed source HTTP, expected deny
- PASS: GUEST-IN, DHCP discover, expected permit
- PASS: GUEST-IN, DNS UDP, expected permit
- PASS: GUEST-IN, DNS TCP, expected permit
- PASS: GUEST-IN, NTP, expected permit
- PASS: GUEST-IN, Authorized HTTP, expected permit
- PASS: GUEST-IN, Wrong HTTP application, expected deny
- PASS: GUEST-IN, Gateway diagnostic, expected permit
- PASS: GUEST-IN, SSH to NOC router, expected deny
- PASS: GUEST-IN, Cross-zone ICMP, expected deny
- PASS: GUEST-IN, Spoofed source HTTP, expected deny
- PASS: CLINIC-IN, DHCP discover, expected permit
- PASS: CLINIC-IN, DNS UDP, expected permit
- PASS: CLINIC-IN, DNS TCP, expected permit
- PASS: CLINIC-IN, NTP, expected permit
- PASS: CLINIC-IN, Authorized HTTP, expected permit
- PASS: CLINIC-IN, Wrong HTTP application, expected deny
- PASS: CLINIC-IN, Gateway diagnostic, expected permit
- PASS: CLINIC-IN, SSH to NOC router, expected deny
- PASS: CLINIC-IN, Cross-zone ICMP, expected deny
- PASS: CLINIC-IN, Spoofed source HTTP, expected deny
- PASS: SERVER-IN, HTTP response ACK, expected permit
- PASS: SERVER-IN, Unsolicited server TCP SYN, expected deny
- PASS: SERVER-IN, EHR ping response, expected permit
- PASS: SERVER-IN, New server ping, expected deny
- PASS: SERVER-IN, DNS reply, expected permit
- PASS: SERVER-IN, NTP reply, expected permit
- PASS: SERVER-IN, Wrong server DNS reply, expected deny

Not tested: simulator acceptance, interface attachment runtime, return-path routing, ARP, same-VLAN forwarding, endpoint service behavior, fragmentation, crafted attacks, or clinical application correctness.
