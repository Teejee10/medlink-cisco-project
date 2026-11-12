import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const texts=['01-r-hq.txt','03-r-clinic.txt'].map(n=>fs.readFileSync(path.join(root,'configs',n),'utf8'));
const acls=new Map();
for(const text of texts){
 for(const m of text.matchAll(/^ip access-list extended (\S+)\n([\s\S]*?)^exit$/gm)){
  acls.set(m[1],m[2].trim().split('\n'));
 }
}
const num=ip=>ip.split('.').reduce((a,b)=>(a*256)+Number(b),0)>>>0;
function addr(tokens,i,ip){
 if(tokens[i]==='any')return [true,i+1];
 if(tokens[i]==='host')return [tokens[i+1]===ip,i+2];
 const [base,wild]=[num(tokens[i]),num(tokens[i+1])];
 const mask=(~wild)>>>0;
 return [((num(ip)&mask)>>>0)===((base&mask)>>>0),i+2];
}
function allowed(name,p){
 assert(acls.has(name),`Missing ACL ${name}`);
 for(const line of acls.get(name)){
  const t=line.split(/\s+/); let i=2;
  if(t[1]!=='ip'&&t[1]!==p.protocol)continue;
  const [sm,si]=addr(t,i,p.src);i=si;if(!sm)continue;
  if(t[i]==='eq'){if(Number(t[i+1])!==p.sport)continue;i+=2;}
  const [dm,di]=addr(t,i,p.dst);i=di;if(!dm)continue;
  if(t[i]==='eq'){if(Number(t[i+1])!==p.dport)continue;i+=2;}
  if(t[i]==='established'&&!p.ack&&!p.rst)continue;
  if(['echo','echo-reply'].includes(t[i])&&t[i]!==p.type)continue;
  return t[0]==='permit';
 }
 return false;
}
const cases=[];
for(const [name,src,service,gw]of[
 ['CLINICAL-IN','10.10.10.100',20,'10.10.10.1'],
 ['BIOMEDICAL-IN','10.10.20.100',30,'10.10.20.1'],
 ['ADMIN-IN','10.10.30.100',10,'10.10.30.1'],
 ['GUEST-IN','10.10.40.100',10,'10.10.40.1'],
 ['CLINIC-IN','10.20.60.100',20,'10.20.60.1']
]){
 const add=(label,p,expect)=>cases.push({name,label,p:{src,...p},expect});
 add('DHCP discover',{src:'0.0.0.0',dst:'255.255.255.255',protocol:'udp',sport:68,dport:67},true);
 add('DNS UDP',{dst:'10.10.50.10',protocol:'udp',sport:53000,dport:53},true);
 add('DNS TCP',{dst:'10.10.50.10',protocol:'tcp',sport:53000,dport:53},true);
 add('NTP',{dst:'10.10.50.10',protocol:'udp',sport:53000,dport:123},true);
 add('Authorized HTTP',{dst:`10.10.50.${service}`,protocol:'tcp',sport:50000,dport:80},true);
 add('Wrong HTTP application',{dst:`10.10.50.${service===20?30:20}`,protocol:'tcp',sport:50000,dport:80},false);
 add('Gateway diagnostic',{dst:gw,protocol:'icmp',type:'echo'},true);
 add('SSH to NOC router',{dst:'10.10.99.1',protocol:'tcp',sport:50000,dport:22},false);
 add('Cross-zone ICMP',{dst:name==='CLINICAL-IN'?'10.10.20.100':'10.10.10.100',protocol:'icmp',type:'echo'},false);
 add('Spoofed source HTTP',{src:'192.0.2.123',dst:`10.10.50.${service}`,protocol:'tcp',sport:50000,dport:80},false);
}
for(const [label,p,expect]of[
 ['HTTP response ACK',{src:'10.10.50.20',dst:'10.20.60.100',protocol:'tcp',sport:80,dport:50000,ack:true},true],
 ['Unsolicited server TCP SYN',{src:'10.10.50.20',dst:'10.20.60.100',protocol:'tcp',sport:80,dport:50000},false],
 ['EHR ping response',{src:'10.10.50.20',dst:'10.20.60.100',protocol:'icmp',type:'echo-reply'},true],
 ['New server ping',{src:'10.10.50.20',dst:'10.10.10.100',protocol:'icmp',type:'echo'},false],
 ['DNS reply',{src:'10.10.50.10',dst:'10.10.40.100',protocol:'udp',sport:53,dport:53000},true],
 ['NTP reply',{src:'10.10.50.10',dst:'10.10.40.100',protocol:'udp',sport:123,dport:53000},true],
 ['Wrong server DNS reply',{src:'10.10.50.20',dst:'10.10.40.100',protocol:'udp',sport:53,dport:53000},false]
])cases.push({name:'SERVER-IN',label,p,expect});
for(const c of cases)assert.equal(allowed(c.name,c.p),c.expect,`${c.name}: ${c.label}`);
const out=`# Offline ACL Policy Checks

PASS: ${cases.length} test cases evaluated against the generated named ACL text.

This independent simplified checker evaluates first-match IPv4/protocol/address/port matching, ICMP echo types, and TCP ACK/RST matching used in these configurations. It is not a Cisco IOS parser, Packet Tracer engine, stateful firewall test, or forwarding test.

${cases.map(c=>`- PASS: ${c.name}, ${c.label}, expected ${c.expect?'permit':'deny'}`).join('\n')}

Not tested: simulator acceptance, interface attachment runtime, return-path routing, ARP, same-VLAN forwarding, endpoint service behavior, fragmentation, crafted attacks, or clinical application correctness.
`;
fs.writeFileSync(path.join(root,'tests','acl-policy-validation.md'),out);
console.log(`PASS ${cases.length} offline ACL policy cases; Packet Tracer execution NOT RUN.`);
