# MediLink Test and Demonstration Guide

The outcomes below are predictions to verify, not measured results. Record actual behavior in `evidence/test-results.csv`, including failures and corrective actions.

## Access policy

The project deliberately uses a narrow allowlist. A guest is a simulated internal guest VLAN, not an Internet-connected WLAN; no Internet access, NAT, encryption or wireless radio coverage is implemented.

| Source zone | Allowed mock web application | Other routed application access |
|---|---|---|
| Clinical, 10.10.10.0/24 | EHR, 10.10.50.20 TCP 80 | Denied except defined infrastructure/diagnostics |
| Biomedical, 10.10.20.0/24 | Telemetry, 10.10.50.30 TCP 80 | Denied except defined infrastructure/diagnostics |
| Administration, 10.10.30.0/24 | Information, 10.10.50.10 TCP 80 | Denied except defined infrastructure/diagnostics |
| Guest, 10.10.40.0/24 | Information, 10.10.50.10 TCP 80 | Denied except defined infrastructure/diagnostics |
| Clinic, 10.20.60.0/24 | EHR, 10.10.50.20 TCP 80 | Denied except defined infrastructure/diagnostics |
| NOC, 10.10.99.0/24 | All mock servers | Trusted management segment; broad routing privilege |
| Servers, 10.10.50.0/24 | Return TCP with ACK/RST; infra DNS/NTP replies; ICMP echo replies | Other new routed traffic denied |

All client zones can request DHCP, query the infrastructure DNS service over UDP/TCP 53, query its NTP service over UDP 123, and ping their own gateway. Clinical/Clinic can ping the EHR server; Biomedical can ping Telemetry. Administration/Guest cannot ping the information server under this deliberately restricted policy, although they can open its HTTP page.

The ACLs match ports and addresses, not application identities. Same-VLAN peers bypass router ACLs; trusted NOC is not restricted by an ingress ACL, and TCP `established` matches ACK/RST rather than maintaining session state ([Cisco ACL data model](https://netascode.cisco.com/docs/data_models/iosxe/device/access_list/)).

## Essential tests

Use the CSV as the full 22-test checklist. The essential demonstration is successful authorized traffic, unsuccessful unauthorized traffic, and authorized service recovery after a single WAN failure.

### Baseline verification

On R-CLINIC:

```text
show ip ospf neighbor
show ip route 10.10.50.0
```

If the specific-prefix `show` variant is unsupported, use `show ip route` and find 10.10.50.0/24. With all links up, its expected next hop is `10.255.0.5`.

On CLINIC-1:

```text
ping 10.10.50.20
```

Then open `http://ehr.medilink.test` in its Web Browser. Capture both the successful page and the route table.

### Segmentation tests

On GUEST-1, successfully open `http://info.medilink.test`, then try `http://10.10.50.20`. On BIOMED-1, successfully open `http://telemetry.medilink.test`, then try `http://10.10.50.20`.

On CLINICAL-1, successfully open EHR, then try Telemetry. Record the PC's actual address from IP Configuration before trying cross-zone pings; do not assume all clients receive .100.

On R-HQ:

```text
show access-lists
```

If counters are modeled in your release, compare deny-counter changes before and after a blocked test. If counters are absent or unreliable, use a filtered Simulation Mode trace and the service tests as evidence; never claim a counter measurement you did not observe.

### Management tests

On NOC-1 > Desktop > Command Prompt:

```text
ssh -l netadmin 10.10.99.1
```

Enter `MediLinkLab2026` when prompted. Repeat to `10.10.99.2` for SW-HQ, then attempt the router SSH command from CLINICAL-1; only the NOC attempt should succeed.

NOC may also administer routers through their loopback addresses 10.255.255.1, .2 and .3 after routing is established. This prototype does not promise management access to every PC or the clinic switch.

## WAN failure experiment

Save the healthy baseline first. Use interface shutdown rather than deleting a cable, so the failure and restoration are reproducible.

On R-HQ:

```text
enable
configure terminal
interface gigabitEthernet0/2
shutdown
end
```

On R-CLINIC:

```text
show ip ospf neighbor
show ip route
```

The expected route to `10.10.50.0/24` changes from next hop `10.255.0.5` to `10.255.0.9`, through R-TRANSIT. Repeat the clinic ping and refresh or reopen the EHR page after convergence.

Recheck that guest access to EHR is still denied while the WAN is using its backup. This combines availability testing with verification that rerouting has not bypassed the access policy.

Restore on R-HQ:

```text
configure terminal
interface gigabitEthernet0/2
no shutdown
end
```

Verify route reversion to `10.255.0.5` and successful EHR access. Save only after the primary and backup are both restored.

### Negative availability control

With the baseline saved, shut both R-HQ G0/1 and G0/2. The Clinic EHR test must fail because the hospital is disconnected from both WAN paths; local DHCP and clinic-gateway ping should still work.

Immediately restore both interfaces with `no shutdown` and verify recovery. This demonstrates a real fault boundary rather than suggesting the system survives arbitrary failures.

## Fair before-and-after security comparison

This is a controlled policy-disabled routed baseline, not a flat Layer-2 network. Use a separate saved copy, and keep only synthetic data.

1. Save `MediLink-policy-disabled-experiment.pkt`.
2. On R-HQ, temporarily detach only the Guest and Biomedical ingress ACLs:

```text
configure terminal
interface gigabitEthernet0/0.40
no ip access-group GUEST-IN in
exit
interface gigabitEthernet0/0.20
no ip access-group BIOMEDICAL-IN in
end
```

3. Test Guest-to-EHR HTTP, Biomedical-to-EHR HTTP and Biomedical-to-Clinical ICMP. They are predicted to succeed if the remaining configuration is healthy; record actual results.
4. Reattach the controls:

```text
configure terminal
interface gigabitEthernet0/0.40
ip access-group GUEST-IN in
exit
interface gigabitEthernet0/0.20
ip access-group BIOMEDICAL-IN in
end
write memory
```

5. Repeat the identical tests and record the expected denial alongside authorized-service successes.
6. Keep the experiment copy separate. Reopen the final protected file and check both ACL attachments before submission.

This comparison measures reachability changes under selected ACLs, not malware infection or ransomware containment in a real hospital. Do not report a percentage reduction in cyberattacks from three synthetic probes.

## Measurement protocol

Avoid invented millisecond convergence figures. Packet Tracer uses simplified models, and Realtime mode is not fixed to a real-world clock under all workloads ([Packet Tracer FAQ](https://tutorials.ptnetacad.net/help/default/faqTroubleShoot.htm)).

### Reachability

For each allowed path, run five rounds of the ordinary PC `ping` command after one warm-up round for ARP and routing settlement. Record the actual number of packets sent and received from the displayed output rather than assuming the count.

\[
\text{Packet delivery ratio}=\frac{\text{received}}{\text{sent}}\times100\%
\]

Use HTTP separately for port-specific authorization. Ping success alone is not application availability.

### Recovery

Run the primary-link shutdown/restoration sequence three times. If collecting timing, use a screen recording and repeated probes with a stated cadence, and report time from shutdown to the first observed successful probe as an approximate, cadence-limited recovery observation.

Record the probe interval and clock basis with every result. Do not equate that observation to OSPF-only convergence, physical fibre restoration, real network SLA, or biomedical service latency.

| Trial | Probe cadence | Clock/mode | Shutdown marker | First success marker | Observed recovery | Evidence |
|---|---|---|---|---|---|---|
| 1 | Not measured | Not recorded | Pending | Pending | Not measured | Pending |
| 2 | Not measured | Not recorded | Pending | Pending | Not measured | Pending |
| 3 | Not measured | Not recorded | Pending | Pending | Not measured | Pending |

## Screenshot plan

Save these with clear filenames in `evidence/`. Screenshots must come from the actual Packet Tracer run.

- **Topology:** `01-topology.png`, showing all devices, VLAN labels and WAN paths.
- **DHCP:** `02-clinical-dhcp.png` and `03-clinic-dhcp.png`.
- **Routing:** `04-ospf-neighbors.png` and `05-primary-route.png`.
- **Authorized access:** `06-clinic-ehr-allowed.png` and `07-biomedical-telemetry-allowed.png`.
- **Policy:** `08-guest-info-allowed.png` and `09-guest-ehr-blocked.png`, plus ACL/trace evidence if available.
- **Failure and recovery:** `10-primary-down.png`, `11-backup-route.png`, `12-ehr-on-backup.png`, `13-primary-restored.png`.
- **Management:** `14-noc-ssh.png` and `15-non-noc-ssh-denied.png`.
- **Controls:** `16-dual-link-failure.png` and before/after policy screenshots if that experiment is run.

## Five-minute presentation

| Time | Demonstration |
|---|---|
| 0:00–0:40 | Explain the problem: controlled clinical communication and continuity under one WAN-link failure |
| 0:40–1:20 | Show the topology, seven zones, direct and backup WAN paths |
| 1:20–2:10 | Show clinic EHR success and guest EHR denial, with guest information-page success |
| 2:10–3:30 | Shut the primary, show new next hop and clinic EHR recovery |
| 3:30–4:10 | Restore the primary and show route reversion |
| 4:10–5:00 | Explain evidence, actual results, limitations and future work |

## Viva preparation

- **Why is it ECE?** It is a data-communication network design and evaluation project, applying packet switching, addressing, routing, communication availability and protocol-based access control. It is not an RF or electronics hardware project.
- **What is the contribution?** A reproducible integrated design, explicit traffic matrix, controlled link-failure experiments, and security/availability verification. OSPF and VLANs themselves are established technologies, not inventions.
- **Why OSPF?** The design uses dynamic route recalculation and explicit link costs rather than manual intervention after a link fails.
- **Does VLAN separation alone secure traffic?** No; routed ACLs enforce the selected inter-zone policy, and same-VLAN traffic remains outside that ACL boundary.
- **Why is the backup cost higher?** It keeps the direct link preferred while preserving a usable alternative after its failure.
- **Does it stop ransomware?** No; it demonstrates restricted network reachability relevant to limiting some lateral paths, not malware detection, endpoint protection or proven containment.
- **Is the traffic encrypted?** SSH administration is encrypted in the model; the mock HTTP applications and simulated WAN are not.
- **Why no QoS or AI?** They are outside the verified core. Adding labels without a meaningful traffic model or trained detector would overstate the project.
- **What still fails?** HQ router/switch failure, server failure, both HQ WAN links, and other failures outside the single-link model.
- **Can it be deployed in a hospital?** Not as supplied. Real deployment needs stateful security, identity, encryption, medical integration, redundancy, risk assessment and testing beyond this simulator.
