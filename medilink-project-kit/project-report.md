# Design and Evaluation of a Segmented Hospital and Remote-Clinic Network with OSPF-Based WAN Failover

Project name: MediLink. This is a final-year Electronics and Communication Engineering simulation-project report draft, not a completed experimental report.

| Submission field | Value |
|---|---|
| Student name | [Enter name] |
| Registration number | [Enter number] |
| Department | Electronics and Communication Engineering |
| Institution | [Enter institution] |
| Supervisor | [Enter supervisor] |
| Academic year | [Enter actual year] |
| Packet Tracer version | [Record installed version] |
| Execution date | [Record actual test date] |
| Status | Design/configuration draft; Packet Tracer runtime validation pending |

## Abstract

MediLink proposes an IPv4 network connecting a simulated hospital and remote clinic while separating clinical, biomedical, administration, guest, server and management traffic. The design combines IEEE 802.1Q VLAN routing, source-side extended access-control lists, local DHCP, internal DNS, restricted SSH management and single-area OSPF. A direct site-to-site connection is preferred over a two-hop transit connection through explicit OSPF costs. The evaluation method includes authorized and unauthorized service requests, primary-link shutdown, backup-path verification, restoration, and a dual-link negative control.

The problem motivation is consistent with HHS guidance identifying discrete network segments for mission-critical assets as a means of minimizing lateral movement following compromise ([HHS performance goals](https://hhscyber.hhs.gov/Documents/cybersecurity-performance-goals.pdf)). The present deliverable is a configuration and experimental framework; actual packet delivery, policy outcomes and recovery observations remain unmeasured. Medical endpoints are represented by PCs, and clinical/telemetry services are represented by static HTTP pages.

## Problem statement

The engineering problem selected for this project is how to preserve authorized hospital-to-clinic communication after a single WAN-link failure while reducing unnecessary reachability between user and device groups. It has two independently testable dimensions: path availability and traffic isolation. A design that restores connectivity but allows guests to access clinical services does not satisfy the security objective, and a design that blocks every connection does not satisfy the availability objective.

Healthcare-specific guidance provides the security context rather than evidence of compliance: HHS describes its performance goals as voluntary practices and explicitly identifies segmentation of mission-critical assets to minimize lateral movement ([HHS performance goals](https://hhscyber.hhs.gov/Documents/cybersecurity-performance-goals.pdf)). This student prototype tests selected network paths only; it does not establish patient safety, legal compliance or resilience to a real ransomware incident.

### Research question

Can a small, reproducible Packet Tracer network maintain access from a remote-clinic workstation to an authorized mock EHR service after one direct WAN link fails, while continuing to deny selected unauthorized traffic from guest and biomedical networks?

### Objectives

- **Addressing:** Define non-overlapping LAN, management, loopback and /30 WAN networks.
- **Segmentation:** Separate seven logical network zones and implement an explicit inter-zone traffic matrix.
- **Routing:** Establish OSPF neighbors and prefer the direct link over the transit backup.
- **Availability:** Demonstrate route change, authorized service recovery and primary-path restoration.
- **Operations:** Provide local DHCP, internal DNS and restricted management access.
- **Evidence:** Record actual positive/negative test results, route tables and failure-state screenshots.

## Scope and feasibility

The proposed implementation contains three routers, two switches, nine workstations and three servers. The design targets a one-day build after software installation and assumes a desktop/laptop, basic copy-and-paste CLI operation and institutional acceptance of simulation-only work.

The project excludes AI, real medical-device integration, RF propagation, fibre transmission modelling, real Internet access, NAT, VPN, stateful firewalls, application authentication, real EHR software, encrypted clinical applications and production deployment. The biomedical and EHR pages are static communication targets; they are not functioning healthcare systems.

### Design alternatives considered

These alternatives are engineering judgments for the stated deadline, not a market survey. The chosen scope prioritizes observable outcomes over the number of advanced protocol names.

| Candidate | One-day implementation risk | Evaluation issue | Decision |
|---|---|---|---|
| Generic campus VLAN network | Lower | Weak problem-specific availability experiment unless extended | Not chosen |
| Full VoIP/QoS hospital network | Higher | Requires meaningful call/load and QoS evidence | Deferred |
| AI ransomware detection | Very high within this scope | No detector, dataset or inference validation provided | Rejected as an unsupported claim |
| Segmented hospital/clinic network with OSPF failover | Moderate | Policy and path changes can be tested explicitly | Selected |

## Technical foundation

### VLAN routing

Router-on-a-stick uses tagged trunk traffic and router subinterfaces to route distinct VLAN subnets; Cisco's configuration example pairs `encapsulation dot1Q` with a subinterface IP and requires the physical interface to be enabled ([Cisco Press inter-VLAN routing](https://www.ciscopress.com/articles/article.asp?p=3089357&seqNum=5)). MediLink assigns one HQ subnet and gateway to each configured VLAN, using R-HQ G0/0 as the trunk-facing physical interface.

### Access control

Cisco documents ACL processing as ordered, first-match evaluation with an implicit deny at the end, and notes that ACLs must be applied to an interface to affect traffic ([Cisco IP ACL guidance](https://www.cisco.com/c/en/us/support/docs/security/ios-firewall/23602-confaccesslists.html)). MediLink attaches named extended ACLs inbound on source-zone router interfaces, explicitly permits DHCP and required services, and ends each controlled-zone ACL with a visible deny.

The server return rule uses TCP `established`, which checks for ACK or RST bits rather than providing a session-state table ([Cisco ACL data model](https://netascode.cisco.com/docs/data_models/iosxe/device/access_list/)). Consequently, this prototype must not be described as a stateful firewall or a zero-trust implementation.

### Dynamic routing

Cisco's Packet Tracer OSPF activity includes single-area OSPFv2, interface cost configuration and suppression of protocol traffic on networks where it is not needed ([Cisco OSPF activity](https://www.netacad.com/content/ensa/1.0/courses/content/m2/en-US/assets/2.7.1-packet-tracer---single-area-ospfv2-configuration.pdf)). MediLink uses process 10 and area 0, assigns unique router IDs and makes LAN-facing interfaces passive while enabling adjacency on the WAN.

### Simulation limits

Packet Tracer implements a subset of Cisco functionality using simplified protocol and IOS models; its troubleshooting guide warns that results should be compared with real equipment and that Realtime execution is not always fixed to a real-world rate ([Packet Tracer FAQ](https://tutorials.ptnetacad.net/help/default/faqTroubleShoot.htm)). The evaluation therefore emphasizes reproducible reachability and next-hop changes, with any timing reported as a simulator observation rather than a hardware benchmark.

## System architecture

The WAN triangle joins R-HQ, R-TRANSIT and R-CLINIC. The hospital contains the VLAN trunk and three mock services; the clinic has an untagged access LAN with its own router-based DHCP service.

```text
                      R-TRANSIT
              cost 50 /      \ cost 50
                     /        \
                   R-HQ------R-CLINIC
                    | cost 10    |
                  SW-HQ       SW-CLINIC
                    |            |
             Six HQ VLANs     Clinic VLAN 60
```

The cost 10 label refers to the horizontal HQ–Clinic link. The costs are symmetric in the supplied configuration.

### Equipment inventory

| Component | Quantity | Role |
|---|---:|---|
| 2911 router | 3 | HQ routing, transit backup, clinic routing |
| 2960-24TT switch | 2 | HQ VLAN access/trunk, clinic access |
| PC-PT | 9 | User, biomedical stand-in, NOC and clinic workstations |
| Server-PT | 3 | Infrastructure, mock EHR, mock telemetry |
| Total devices | 17 | Simulation topology |

### Address plan

| Segment | VLAN | Subnet | Gateway or endpoints |
|---|---:|---|---|
| Clinical | 10 | 10.10.10.0/24 | 10.10.10.1 |
| Biomedical | 20 | 10.10.20.0/24 | 10.10.20.1 |
| Administration | 30 | 10.10.30.0/24 | 10.10.30.1 |
| Guest | 40 | 10.10.40.0/24 | 10.10.40.1 |
| Servers | 50 | 10.10.50.0/24 | 10.10.50.1 |
| Management | 99 | 10.10.99.0/24 | 10.10.99.1 |
| Clinic | 60 | 10.20.60.0/24 | 10.20.60.1 |
| HQ–Transit | Not applicable | 10.255.0.0/30 | HQ .1; Transit .2 |
| HQ–Clinic | Not applicable | 10.255.0.4/30 | HQ .5; Clinic .6 |
| Transit–Clinic | Not applicable | 10.255.0.8/30 | Transit .9; Clinic .10 |
| Router loopbacks | Not applicable | Individual /32s | 10.255.255.1, .2, .3 |

Servers use .10, .20 and .30 in their subnet, and SW-HQ uses 10.10.99.2. DHCP on each user subnet excludes .1 through .99 to reserve infrastructure addresses.

### Application policy

| Zone | Permitted mock HTTP service | Key negative test |
|---|---|---|
| Clinical | EHR 10.10.50.20 | Clinical to Telemetry denied |
| Biomedical | Telemetry 10.10.50.30 | Biomedical to EHR denied |
| Administration | Information 10.10.50.10 | Administration to EHR denied |
| Guest | Information 10.10.50.10 | Guest to EHR denied |
| Clinic | EHR 10.10.50.20 | Clinic to other user zones denied |
| Management | Trusted administration access | Nonmanagement SSH denied |

Client ACLs additionally permit the infrastructure DNS/NTP services, local DHCP and defined ICMP diagnostics. Server ingress permits TCP ACK/RST return traffic, DNS/NTP replies from INFRA-SRV, and ICMP echo replies; it blocks other new routed server traffic.

## Implementation

The deployment sequence is install, place, cable, configure network devices, generate SSH keys, configure server services, obtain client DHCP leases, verify routes, run access tests, and execute failure experiments. The exact port map and GUI steps are in `deployment-guide.md`; device commands are supplied in `configs/`.

### Routing preference

The direct WAN edge has configured cost 10; the two backup edges each have cost 50. The abstract WAN-only path comparison is:

\[
C_{\text{direct}}=10,\qquad C_{\text{backup}}=50+50=100
\]

The final LAN-interface cost is additional when viewing a route to a server subnet. The expected clinic next hop for 10.10.50.0/24 is 10.255.0.5 normally and 10.255.0.9 after the direct link fails.

### Operational security

VTY access uses local credentials, SSH-only transport and a source ACL permitting the NOC subnet. Access ports use sticky MAC port security, a one-address maximum, restricted violation handling, PortFast and BPDU Guard; unused switch ports are shut and assigned to a parking VLAN.

These are configuration intentions awaiting runtime verification. The included lab passwords are publicly visible examples and must not be reused for a real installation.

## Experimental methodology

### Hypotheses

- **H1:** Clinical and clinic workstations can access mock EHR while guest and biomedical workstations cannot.
- **H2:** Biomedical workstations can access mock Telemetry, and guest/administration workstations can access mock Information.
- **H3:** Single primary-link failure leads to a backup next hop and eventual restoration of clinic EHR connectivity without manual route changes.
- **H4:** A primary-link restoration returns the route to the preferred direct path.
- **H5:** Simultaneous failure of both HQ WAN links breaks clinic-to-EHR connectivity, defining the limit of the design.

### Procedure

Establish a healthy baseline and confirm OSPF neighbors, addresses, VLAN membership and authorized application access. Run both allowed and denied HTTP tests and preserve evidence; a denial is meaningful only if a relevant authorized service still works.

For availability, shut R-HQ G0/2, inspect R-CLINIC's route to the server subnet, and retry the EHR application. Repeat after restoring the interface, then perform the dual-link negative control. Execute three failure/restoration trials if collecting repeatability data.

For a controlled policy comparison, save a separate copy, detach Guest and Biomedical source ACLs, and test the same unauthorized flows before and after reattaching them. This is a policy-disabled routed baseline, not a flat network; no real attack or patient data is used.

### Metrics

| Metric | Collection method | Interpretation |
|---|---|---|
| DHCP correctness | PC configuration and router bindings | Address, mask, gateway and DNS match intended subnet |
| Authorized service delivery | HTTP and diagnostic ping | Selected permitted flow works |
| Unauthorized access denial | Target-specific HTTP and ICMP | Selected prohibited flow is blocked |
| Route transition | Before/failure/restored route tables | Primary, backup, primary next-hop sequence |
| Packet delivery ratio | Actual ping sent/received counts | Per-test delivery under the stated simulator conditions |
| Recovery observation, optional | Repeated probes plus timestamped recording | Cadence-limited simulated recovery, not real hardware convergence |

\[
\text{PDR}=\frac{N_{\text{received}}}{N_{\text{sent}}}\times100\%
\]

For timing, report probe cadence, simulator mode and clock basis. Do not assign zero milliseconds or an assumed OSPF timer value to unmeasured recovery.

## Results and validation status

**No Packet Tracer execution results are available in this draft.** Blank cells below must be completed from the student's actual run, with screenshots and any corrective changes.

| Evaluation item | Predicted outcome | Actual observation | Status |
|---|---|---|---|
| Clinical/clinic EHR HTTP | Success | Pending | NOT RUN |
| Biomedical Telemetry HTTP | Success | Pending | NOT RUN |
| Guest Information HTTP | Success | Pending | NOT RUN |
| Guest/Biomedical EHR HTTP | Denied | Pending | NOT RUN |
| NOC SSH | Success | Pending | NOT RUN |
| Non-NOC SSH | Denied | Pending | NOT RUN |
| Primary-link shutdown | Backup next hop .9; service recovers | Pending | NOT RUN |
| Primary-link restoration | Primary next hop .5 returns | Pending | NOT RUN |
| Both HQ WAN links down | Clinic EHR unavailable | Pending | NOT RUN |
| Server-initiated routed ping | Denied | Pending | NOT RUN |

Offline checks are documented in `tests/static-validation.md` and `tests/acl-policy-validation.md`. Address uniqueness, matching WAN endpoints/costs, VLAN/subinterface correspondence and the abstract primary/backup cost comparison passed; all 57 text-policy test cases also passed against a simplified independent ACL matcher. These checks do not validate Packet Tracer parser acceptance, actual forwarding, service GUI settings or timing.

### Student completion notes

Replace this subsection with actual findings after testing. Report which tests passed, which failed, what configuration changes were required, and whether the observed route sequence supported H3/H4; retain failed results rather than rewriting predictions as measurements.

For any numerical summary, state the denominator and exact tests included. A pass proportion for selected synthetic probes is not a measured cybersecurity-risk reduction.

## Discussion

The principal engineering trade-off is integrated scope versus one-day reproducibility. Router-on-a-stick reduces device count but concentrates inter-VLAN traffic on one link and leaves a single router/switch failure boundary at HQ; the backup WAN addresses link-path failure rather than complete site redundancy.

The service policy is intentionally narrower than a real hospital workflow. For example, administration is denied EHR access in this model to provide a clear access-control experiment, not because all hospital administrators should always be denied clinical systems.

The design's contribution is the integration, reproducibility and evaluation procedure. It makes no claim to invent OSPF, VLAN routing, ACLs or a new healthcare security architecture.

## Limitations and threats to validity

- **Simulation fidelity:** Protocol behavior and timing are simplified; hardware validation remains necessary ([Packet Tracer FAQ](https://tutorials.ptnetacad.net/help/default/faqTroubleShoot.htm)).
- **Availability scope:** HQ router, HQ switch and each server remain single points of failure; no gateway redundancy or server replication is provided.
- **WAN abstraction:** Ethernet links stand in for separate transport paths without modelling geography, actual diverse fibre routes, propagation, carrier SLAs or correlated outages.
- **Stateless filtering:** ACK/RST matching is not connection tracking; the server return policy can be bypassed by crafted matching packets and is not an application firewall ([Cisco ACK/RST matching](https://netascode.cisco.com/docs/data_models/iosxe/device/access_list/)).
- **Same-zone exposure:** Same-VLAN endpoints, including all three servers, communicate at Layer 2 outside router ACLs.
- **Trust and spoofing:** The NOC segment is broadly trusted; no identity-based device admission, DHCP snooping, source validation or comprehensive anti-spoofing is implemented.
- **Management isolation:** The clinic switch is intentionally not remotely IP-managed in this one-day build.
- **Applications:** HTTP is unencrypted and pages are static; no authentication, clinical protocol validation, data integrity or medical safety claim follows.
- **Security evaluation:** Reachability tests do not emulate infection, malicious lateral movement, data exfiltration or ransomware containment.
- **Evidence status:** Runtime screenshots, completed CSV results and a saved `.pkt` must still be supplied by the actual build.

## Conclusion

MediLink defines a reproducible simulation architecture for jointly examining network access policy and communication recovery under a single WAN-link failure. The planned verification combines service-specific positive/negative tests with primary, backup and restored route evidence.

At this draft stage the configuration and experimental method are prepared, but the project cannot be declared operational or experimentally successful until Packet Tracer tests are completed. Final conclusions must be revised using the actual observed outcomes rather than the predicted results.

## Future work

- **Campus redundancy:** Introduce redundant distribution/gateway devices and evaluate whole-router/switch failure.
- **Stronger security:** Separate application servers into distinct protected zones and use stateful enforcement, identity-aware access and anti-spoofing.
- **Secure application transport:** Add properly authenticated encrypted application traffic and secure inter-site transport.
- **Communication performance:** Add a meaningful load model and evaluate QoS or voice requirements with appropriate tools.
- **Physical validation:** Reproduce selected tests on hardware or a suitable higher-fidelity environment and compare recovery measurements.
- **Biomedical integration:** Use approved synthetic-device models or laboratory sensors, with explicit safety and interface constraints.
