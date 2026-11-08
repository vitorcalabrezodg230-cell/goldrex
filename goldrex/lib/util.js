const crypto=require('crypto');
exports.id=(n=9)=>crypto.randomBytes(n).toString('hex');
exports.hash=(s,salt)=>crypto.scryptSync(String(s),salt,32).toString('hex');
exports.eq=(a,b)=>{a=Buffer.from(String(a));b=Buffer.from(String(b));return a.length===b.length&&crypto.timingSafeEqual(a,b)};
const tlv=(i,v)=>i+String(v.length).padStart(2,'0')+v;
const crc=s=>{let c=0xFFFF;for(const ch of Buffer.from(s)){c^=ch<<8;for(let i=0;i<8;i++)c=c&0x8000?((c<<1)^0x1021)&0xFFFF:(c<<1)&0xFFFF}return c.toString(16).toUpperCase().padStart(4,'0')};
const asc=s=>String(s||'').normalize('NFD').replace(/[^\x20-\x7e]/g,'').toUpperCase();
exports.pix=(k,name,city,cents,txid)=>{const p=tlv('00','01')+tlv('26',tlv('00','br.gov.bcb.pix')+tlv('01',k))+tlv('52','0000')+tlv('53','986')+tlv('54',(cents/100).toFixed(2))+tlv('58','BR')+tlv('59',asc(name).slice(0,25)||'LOJA')+tlv('60',asc(city).slice(0,15)||'BRASIL')+tlv('62',tlv('05',txid.slice(0,25)))+'6304';return p+crc(p)};
