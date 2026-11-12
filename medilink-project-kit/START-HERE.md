# MediLink Project Kit

MediLink is a proposed final-year ECE simulation project: Design and Evaluation of a Segmented Hospital and Remote-Clinic Network with OSPF-Based WAN Failover. This kit provides the topology, copy-and-paste configurations, deployment instructions, experiments, and an academically honest report draft.

## Read this first

**This kit does not contain a working `.pkt` file.** Packet Tracer is not installed in the authoring environment, so no claim of simulator execution, measured recovery time, or completed connectivity testing is made. Assemble the topology in your installed Packet Tracer, apply the configurations, run the tests, and save the resulting project.

The prototype models medical endpoints with ordinary PCs and medical applications with static HTTP pages. It does not detect ransomware, perform real patient monitoring, implement AI, implement clinical protocols, or deliver production hospital security.

## Project scope

- **Communication continuity:** A preferred direct hospital-to-clinic link plus a two-hop backup path, controlled by OSPF costs.
- **Segmentation:** Clinical, biomedical, administration, guest, server, management, and clinic networks.
- **Access policy:** Each user zone can access only its prescribed mock service, DNS, NTP, and limited diagnostic traffic.
- **Operations:** Local DHCP, internal DNS, restricted SSH administration, access-port security, and optional NTP/syslog.
- **Evaluation:** Positive and negative access tests, route-change evidence, link failure/restoration, and a deliberate dual-link failure control.

HHS identifies separation of mission-critical assets into discrete network segments as a way to minimize lateral movement after compromise; this is the security motivation, not a claim that this small prototype achieves healthcare compliance ([HHS performance goals](https://hhscyber.hhs.gov/Documents/cybersecurity-performance-goals.pdf)).

## Files and build order

| File or folder | Purpose |
|---|---|
| `deployment-guide.md` | Installation, exact placement/cabling, configuration, troubleshooting |
| `configs/01-r-hq.txt` | Main hospital router |
| `configs/02-r-transit.txt` | Backup-path transit router |
| `configs/03-r-clinic.txt` | Remote clinic router |
| `configs/04-sw-hq.txt` | Hospital access switch |
| `configs/05-sw-clinic.txt` | Clinic access switch |
| `configs/06-enable-ssh.txt` | Interactive RSA/SSH setup, after main configurations |
| `test-and-demo-guide.md` | Experiments, expected outcomes, screenshot plan, viva |
| `evidence/test-results.csv` | Blank actual-results sheet; all entries start NOT RUN |
| `project-report.md` | Report draft; complete identity fields and measured results |
| `tests/static-validation.md` | What was and was not verified offline |
| `tests/design-model.json` | Machine-readable network design |
| `tests/acl-policy-validation.md` | Results of 57 offline packet-policy checks, not simulator tests |

## One-day execution target

These are planning allowances, not guaranteed completion times. Start with the core and do not spend the whole day adding features.

| Work block | Target allowance | Exit condition |
|---|---:|---|
| Installation and orientation | 45 minutes | Packet Tracer opens and saves an empty file |
| Device placement and cabling | 45 minutes | All specified devices and ports connected |
| Router/switch setup | 90 minutes | OSPF neighbors up and DHCP addresses assigned |
| Server services and policy debugging | 75 minutes | Authorized service tests pass and blocked tests fail |
| Failover experiments and evidence | 60 minutes | Before/down/restored screenshots captured |
| Report completion and packaging | 90 minutes | Actual results recorded and files reopen |
| Buffer | 60 minutes | Resolve version or configuration issues |

Core acceptance requires T01–T18 and T20 from the test matrix. Port-security inspection is strongly recommended; NTP and syslog are optional if version issues threaten the deadline.

## Submission checklist

- [ ] Obtain departmental approval for a simulation-only ECE networking project.
- [ ] Replace student, supervisor, institution and academic-year placeholders.
- [ ] Run the tests; record real results including failures and limitations.
- [ ] Save `MediLink-final.pkt` with both WAN paths restored.
- [ ] Reopen the `.pkt` and repeat an allowed, denied, and failover test.
- [ ] Save screenshots, actual configurations, results CSV and completed report together.
- [ ] Remove any claim of measurements that were not actually taken.

The supplied passwords are public lab examples. Never reuse these passwords in a real network, and never use real patient data.
