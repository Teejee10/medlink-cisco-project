# MediLink Deployment Guide

This guide assumes a desktop or laptop and a fresh Packet Tracer project. The requested tool is Cisco Packet Tracer, not “Package Tracer.”

## Install from Cisco

Cisco's resource hub lists Packet Tracer downloads for Windows, macOS and Ubuntu, and currently lists version 9.0.1; the listed requirements include an x86-64 CPU, 4 GB of free RAM and 1.4 GB of free disk space, with Windows 11, macOS 12 or newer, or Ubuntu 22.04/24.04 LTS ([Cisco Resource Hub](https://skillsforall.com/resources/lab-downloads)). Verify compatibility on that page, particularly for ARM-based computers, rather than assuming the installer matches your hardware.

1. Open [Cisco Resource Hub](https://skillsforall.com/resources/lab-downloads).
2. Sign in or create your own Cisco account if prompted. Do not share your password here.
3. If enrollment is required, use the free [Getting Started with Cisco Packet Tracer course](https://www.netacad.com/courses/getting-started-cisco-packet-tracer?courseLang=en-US), which explicitly offers enrollment to download Packet Tracer.
4. Choose the installer for your actual operating system. Do not download redistributed installers from GitHub, archives, or unofficial download sites.
5. On Windows, open the downloaded installer, accept the license if you agree, retain the default installation folder, and install. On macOS, open the `.dmg` and follow the installation wizard; on Ubuntu use Cisco's documented command below with the actual downloaded filename ([Cisco installation instructions](https://www.netacad.com/skillsforall/files/Cisco_Packet_Tracer_Download_and_Installation_Instructions.pdf)).

```bash
sudo apt-get install ./CiscoPacketTracer_xxx_Ubuntu_64bit.deb
```

6. Launch Packet Tracer, choose No for multi-user startup for this lab, and authenticate using the login option shown in your installed release; Cisco's installation PDF describes the browser-based LOGIN flow, while the resource hub also mentions Skills For All authentication ([Cisco installation instructions](https://www.netacad.com/skillsforall/files/Cisco_Packet_Tracer_Download_and_Installation_Instructions.pdf), [Resource Hub](https://skillsforall.com/resources/lab-downloads)).
7. Create a blank project and save it as `MediLink-01-empty.pkt`. Record the version from Help > About.

Packet Tracer is not offered for smartphones and tablets in Cisco's installation instructions ([Cisco installation instructions](https://www.netacad.com/skillsforall/files/Cisco_Packet_Tracer_Download_and_Installation_Instructions.pdf)). If you only have a phone, obtain access to a college-lab computer before proceeding.

## Place and rename the devices

Use the Logical workspace and Realtime mode. At the bottom-left choose Network Devices > Routers or Switches, then End Devices for PCs and servers.

| Device type | Quantity | Exact names |
|---|---:|---|
| Cisco 2911 router | 3 | R-HQ, R-TRANSIT, R-CLINIC |
| Cisco 2960-24TT switch | 2 | SW-HQ, SW-CLINIC |
| PC-PT | 9 | CLINICAL-1, CLINICAL-2, BIOMED-1, BIOMED-2, ADMIN-1, GUEST-1, NOC-1, CLINIC-1, CLINIC-2 |
| Server-PT | 3 | INFRA-SRV, EHR-SRV, TELEMETRY-SRV |

Total: 17 devices. Click each device > Config > Display Name to rename it; the supplied CLI scripts separately set IOS hostnames.

Use the 2911 model because this design explicitly uses G0/0, G0/1 and G0/2. If your selected router has different interface names, stop and either select 2911 or systematically adapt every affected command and cable.

Arrange the hospital devices on the left and clinic on the right. Put R-TRANSIT above the two site routers; the WAN forms a triangle.

```text
                        R-TRANSIT
                      /            \
           backup 50 /              \ backup 50
                    /                \
                 R-HQ ---primary 10--- R-CLINIC
                   |                       |
               802.1Q trunk            untagged LAN
                   |                       |
                 SW-HQ                 SW-CLINIC
         clinical / biomedical          clinic PCs
         admin / guest / NOC
         infrastructure / EHR / telemetry servers
```

The numbers on the WAN links are configured OSPF interface costs, not delay, speed, kilometres or monetary prices. The backup path has a WAN cost of 100, compared with 10 for the direct path; destination-interface cost is additional.

## Cable the topology exactly

Choose Connections, the lightning-bolt icon. Use Copper Straight-Through for endpoint-to-switch and router-to-switch cables; use Copper Cross-Over for router-to-router cables, or Packet Tracer's automatic cable selection if necessary.

| End A | Port A | End B | Port B |
|---|---|---|---|
| R-HQ | G0/0 | SW-HQ | G0/1 |
| R-HQ | G0/1 | R-TRANSIT | G0/0 |
| R-HQ | G0/2 | R-CLINIC | G0/2 |
| R-TRANSIT | G0/1 | R-CLINIC | G0/1 |
| R-CLINIC | G0/0 | SW-CLINIC | G0/1 |
| CLINICAL-1 | FastEthernet0 | SW-HQ | F0/1 |
| CLINICAL-2 | FastEthernet0 | SW-HQ | F0/2 |
| BIOMED-1 | FastEthernet0 | SW-HQ | F0/3 |
| BIOMED-2 | FastEthernet0 | SW-HQ | F0/4 |
| ADMIN-1 | FastEthernet0 | SW-HQ | F0/5 |
| GUEST-1 | FastEthernet0 | SW-HQ | F0/6 |
| NOC-1 | FastEthernet0 | SW-HQ | F0/7 |
| INFRA-SRV | FastEthernet0 | SW-HQ | F0/8 |
| EHR-SRV | FastEthernet0 | SW-HQ | F0/9 |
| TELEMETRY-SRV | FastEthernet0 | SW-HQ | F0/10 |
| CLINIC-1 | FastEthernet0 | SW-CLINIC | F0/1 |
| CLINIC-2 | FastEthernet0 | SW-CLINIC | F0/2 |

A red router link is normal before `no shutdown` is applied. An amber switch port may need time to become forwarding; Cisco documents STP startup delays and simplified simulation behavior ([Packet Tracer troubleshooting guide](https://tutorials.ptnetacad.net/help/default/faqTroubleShoot.htm)).

## Apply the five main configurations

1. Click R-HQ > CLI. If asked to enter the initial configuration dialog, type `no` and press Enter; press Enter again if requested.
2. Open `configs/01-r-hq.txt` in a plain-text editor. Copy its content into the CLI, using Ctrl+V or the CLI Paste control as supported.
3. If a large paste drops lines, paste smaller complete sections. Do not continue after an invalid-command message without checking the failing line.
4. Repeat with files 02, 03, 04 and 05 on their matching devices.
5. Save `MediLink-02-configured.pkt`.

These files are text to paste, not files to open using Packet Tracer's File > Open. They do not configure endpoint GUI services or automatically create the topology.

## Enable SSH separately

The key-generation step has an interactive prompt, so do not blindly paste all of file 06 at once. On each router and on SW-HQ, issue:

```text
enable
configure terminal
crypto key generate rsa
```

When asked for modulus bits, enter `1024`. Then issue:

```text
ip ssh version 2
end
write memory
```

Use a larger supported key if your simulator supports it; 1024 is included only for lab compatibility, not as a production recommendation. SW-CLINIC intentionally has no IP management interface, so remote SSH to it is not part of this build.

Lab login: username `netadmin`, password `MediLinkLab2026`. The enable secret is `MediLinkEnable2026`; these values are included in the configuration files and are not private.

## Configure servers in the GUI

For each server, click Desktop > IP Configuration > Static and enter:

| Server | IPv4 address | Mask | Default gateway | DNS |
|---|---|---|---|---|
| INFRA-SRV | 10.10.50.10 | 255.255.255.0 | 10.10.50.1 | 10.10.50.10 |
| EHR-SRV | 10.10.50.20 | 255.255.255.0 | 10.10.50.1 | 10.10.50.10 |
| TELEMETRY-SRV | 10.10.50.30 | 255.255.255.0 | 10.10.50.1 | 10.10.50.10 |

All servers reside in VLAN 50. The router ACL cannot isolate servers from each other within this shared Layer-2 network.

### Infrastructure services

On INFRA-SRV > Services > DNS, switch DNS On. Add these A records using the Add button:

| Name | Address |
|---|---|
| info.medilink.test | 10.10.50.10 |
| ehr.medilink.test | 10.10.50.20 |
| telemetry.medilink.test | 10.10.50.30 |

On Services > HTTP, turn HTTP On. Edit `index.html` with a basic mock public information page, for example:

```html
<html><body><h1>MediLink Hospital Information</h1><p>Simulation only. No patient data. Guest and administration access is limited to this information service.</p></body></html>
```

This is a short content string for Packet Tracer's built-in server, not a separately deployed website. On Services > NTP, enable NTP if offered; on Services > SYSLOG, turn the service On if offered.

### Mock clinical and telemetry services

On EHR-SRV > Services > HTTP, turn HTTP On and edit `index.html` to:

```html
<html><body><h1>MediLink Mock EHR</h1><p>Clinical connectivity demonstration. Synthetic example: DEMO-001. No real patient records.</p></body></html>
```

On TELEMETRY-SRV > Services > HTTP, turn HTTP On and edit `index.html` to:

```html
<html><body><h1>MediLink Mock Telemetry</h1><p>Biomedical communication endpoint. Static demonstration page only; no sensor measurements are collected.</p></body></html>
```

Save each page in the server editor. Disable unused FTP, email and other services where the GUI allows; HTTP is deliberately unencrypted demonstration traffic and must not be presented as a secure clinical application.

## Set every PC to DHCP

Click each PC > Desktop > IP Configuration > DHCP. If it initially fails, verify the cable and router interface, then select Static and DHCP again to retry.

| PCs | Expected subnet | Gateway | DNS |
|---|---|---|---|
| CLINICAL-1, CLINICAL-2 | 10.10.10.0/24 | 10.10.10.1 | 10.10.50.10 |
| BIOMED-1, BIOMED-2 | 10.10.20.0/24 | 10.10.20.1 | 10.10.50.10 |
| ADMIN-1 | 10.10.30.0/24 | 10.10.30.1 | 10.10.50.10 |
| GUEST-1 | 10.10.40.0/24 | 10.10.40.1 | 10.10.50.10 |
| NOC-1 | 10.10.99.0/24 | 10.10.99.1 | 10.10.50.10 |
| CLINIC-1, CLINIC-2 | 10.20.60.0/24 | 10.20.60.1 | 10.10.50.10 |

DHCP reserves addresses .1 through .99 and allocates from .100 upward. Each site's router provides its own client DHCP; no DHCP relay or dependency on the WAN is needed for local lease assignment.

## Initial verification

On every router run:

```text
show ip interface brief
show ip ospf neighbor
show ip route
show ip protocols
```

Expect two FULL OSPF neighbors on each router with all three WAN links up. DR/BDR suffixes can vary because these are Ethernet broadcast segments; they need not match a fixed screenshot.

On R-HQ run:

```text
show ip dhcp binding
show access-lists
show running-config
```

On SW-HQ run:

```text
show vlan brief
show interfaces trunk
show port-security interface fastEthernet0/1
```

The trunk must carry 10,20,30,40,50,99. Access ports appear in their VLANs in `show vlan brief`; trunk ports are checked separately using `show interfaces trunk`, consistent with Cisco's router-on-a-stick verification approach ([Cisco Press](https://www.ciscopress.com/articles/article.asp?p=3089357&seqNum=5)).

On CLINIC-1 > Desktop > Command Prompt:

```text
ipconfig /all
ping 10.20.60.1
ping 10.10.50.20
```

On CLINIC-1 > Desktop > Web Browser open `http://ehr.medilink.test`. On GUEST-1 open `http://info.medilink.test` and then try `http://10.10.50.20`; the first should succeed and the second should fail.

Do not use Guest-to-EHR ping failure alone as proof that HTTP is blocked. Test the HTTP port directly, and retain both an allowed-service success and a denied-service failure so a broken network is not mistaken for successful security.

## Troubleshooting

| Symptom | Inspect and correct |
|---|---|
| Invalid interface command | Confirm 2911 and interface names using `show ip interface brief`; do not substitute a different model silently |
| Invalid optional NTP/logging command | Record it and omit that optional service; do not remove ACL or OSPF controls to make the demonstration appear successful |
| DHCP fails on all HQ clients | R-HQ G0/0 up, switch G0/1 trunk, matching VLANs, DHCP pool networks, ACL DHCP permit first |
| Only one PC fails | Its access port, cable, VLAN and port-security violation counters |
| No OSPF neighbors | Both WAN endpoints up, paired /30 addresses, matching area 0, corresponding no-passive-interface |
| Neighbors form but no clinic EHR | Route on both routers, Clinic ingress ACL, EHR gateway .1, server HTTP On |
| IP works but name fails | DNS On, A record exactly correct, PC DNS .10, UDP/TCP 53 permitted |
| Guest info page fails | DNS and HTTP on INFRA-SRV, guest ACL permits .10 port 80, SERVER-IN permits TCP established return |
| SSH fails from NOC | RSA key generated, `ip ssh version 2`, username/password, NOC actually in 10.10.99.0/24 |
| Switch management VLAN down | VLAN 99 exists and NOC-1's F0/7 is connected/forwarding |
| F0/1 stops forwarding after swapping PCs | Check `show port-security interface fa0/1`; sticky MAC learning intentionally constrains the port |
| First ping loses a packet | Repeat after ARP resolves and routes settle; do not fabricate a zero-loss initial run |

Do not paste a corrective ACL over an existing ACL expecting it to replace the old lines: IOS may append entries after the deny. To rebuild, use console access, remove the named ACL with `no ip access-list extended NAME`, then recreate its complete entries in order and confirm the interface attachment.

## Save checkpoints

Use `write memory` on each device after changes and File > Save in Packet Tracer. Keep `MediLink-03-baseline.pkt`, `MediLink-04-tested.pkt`, and `MediLink-final.pkt`; the final file must have both WAN paths restored and should reopen successfully.
