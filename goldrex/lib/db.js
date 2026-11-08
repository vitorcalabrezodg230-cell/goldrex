const fs=require('fs'),path=require('path');
const DIR=path.join(__dirname,'..','data'),F=path.join(DIR,'db.json'),BK=path.join(DIR,'backups');
const SITE={brand:'GOLDREX',welcome:'Explore o meu universo',cover:'',accent:'#8b3dff',gold:'#d4af37',bg:'#07030c',areas:{fotos:true,videos:true,live:true,chat:true},counters:true,
howto:'1. Escolha uma foto ou um vídeo e toque em Comprar.\n2. Pague com o QR Code ou com o Pix copia e cola.\n3. Depois que o pagamento for confirmado, o conteúdo é liberado na aba Compra e no link de acesso do seu pedido.\n4. Guarde o link de acesso. Se trocar de aparelho, recupere seus pedidos com o código do pedido e o e-mail.'};
const back=[{label:'Voltar ao início',next:'start'}];
const ROBOT={enabled:true,humanAvailable:false,start:'start',msgPaid:'Pagamento confirmado! Seu conteúdo foi liberado.',msgHuman:'Conversa encaminhada para um atendente. Aguarde a resposta por aqui.',msgNoHuman:'Nenhum atendente está disponível agora. Deixe sua mensagem aqui: ela fica registrada e será respondida assim que possível.',msgFallback:'Não consegui entender. Escolha uma das opções abaixo ou fale com um atendente.',
nodes:{start:{text:'Olá! Eu sou o assistente automático da Goldrex. Como posso ajudar?',options:[{label:'Quero ver fotos',next:'fotos'},{label:'Quero ver vídeos',next:'videos'},{label:'Serviços ao vivo',next:'live'},{label:'Ver preços',next:'prices'},{label:'Falar com atendente',next:'human'}]},
fotos:{text:'As fotos são vendidas uma a uma, cada uma com o seu preço e uma prévia borrada. Quer abrir o catálogo de fotos?',go:'fotos',options:back},
videos:{text:'Os vídeos também têm preço individual e mostram uma prévia borrada antes da compra. Quer abrir o catálogo de vídeos?',go:'videos',options:back},
live:{text:'Os serviços ao vivo são agendados: você escolhe a modalidade, vê o valor e os horários disponíveis e só confirma depois de ver o orçamento. Quer ver as modalidades?',go:'live',options:back},
prices:{type:'prices',text:'Estes são os valores cadastrados no momento:',options:back},
human:{type:'human',text:'',options:back}}};
const fresh=()=>({v:2,admins:[],rec:null,site:{live:SITE,draft:SITE},pix:{copia:'',key:'dollyrodrigues24@gmail.com',name:'XP',city:'BRASIL'},profiles:[],items:[],live:{services:[],loop:'',loopOn:true},robot:ROBOT,orders:[],chats:[],leads:[],log:[]});
function migrate(o){const n=fresh();if(o.admin){n.admins=[{id:'a1',email:String(o.admin.login).toLowerCase(),role:'admin',salt:o.admin.salt,hash:o.admin.hash,v:1}];n.rec={salt:o.admin.rsalt,hash:o.admin.rhash}}
 if(o.pix)n.pix={...n.pix,...o.pix};if(o.door)n.door=o.door;n.log=o.log||[];n.legacy={products:o.products,videos:o.videos,orders:o.orders};return n}
/* ---------- integridade ---------- */
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
/* devolve null se a estrutura estiver íntegra, ou a descrição do problema */
function check(d){if(!isObj(d))return'raiz não é um objeto';if(d.v!==2)return'versão inesperada';
 for(const k of['admins','profiles','items','orders','chats','leads','log'])if(!Array.isArray(d[k]))return'campo "'+k+'" ausente ou inválido';
 if(!isObj(d.site)||!isObj(d.site.live)||!isObj(d.site.draft))return'campo "site" inválido';if(!isObj(d.pix))return'campo "pix" inválido';
 if(!isObj(d.live)||!Array.isArray(d.live.services))return'campo "live" inválido';if(!isObj(d.robot)||!isObj(d.robot.nodes))return'campo "robot" inválido';
 if(d.admins.some(a=>!isObj(a)||!a.id||!a.email||!a.salt||!a.hash))return'registro de administrador inválido';
 if(d.orders.some(o=>!isObj(o)||!o.id||!o.code||!o.token))return'registro de pedido inválido';
 if(d.items.some(i=>!isObj(i)||!i.id))return'registro de item inválido';return null}
exports.check=check;
class DbError extends Error{constructor(m,code){super(m);this.name='DbError';this.code=code||'DB_INVALID'}}
exports.DbError=DbError;
const stamp=()=>new Date().toISOString().replace(/[:.]/g,'-');
function copyTo(label){try{fs.mkdirSync(BK,{recursive:true});const dest=path.join(BK,'db-'+label+'-'+stamp()+'.json');fs.copyFileSync(F,dest);try{fs.chmodSync(dest,0o600)}catch{}return dest}catch(e){throw new DbError('Não foi possível criar o backup do banco ('+(e.code||e.message)+'). Nada foi alterado.','DB_BACKUP')}}
function prune(prefix,keep){try{fs.readdirSync(BK).filter(f=>f.startsWith(prefix)&&f.endsWith('.json')).sort().reverse().slice(keep).forEach(f=>fs.unlink(path.join(BK,f),()=>{}))}catch{}}
let db=null,lastBk=0;
function writeAtomic(text){fs.mkdirSync(DIR,{recursive:true});const t=F+'.tmp',fd=fs.openSync(t,'w',0o600);try{fs.writeFileSync(fd,text);fs.fsyncSync(fd)}finally{fs.closeSync(fd)}fs.renameSync(t,F)}
/* Lê o banco. Arquivo inexistente => banco novo. Arquivo existente mas ilegível/corrompido => ERRO (nunca vira banco vazio). */
function load(){let raw;try{raw=fs.readFileSync(F,'utf8')}catch(e){if(e.code==='ENOENT'){const n=fresh();const err=check(n);if(err)throw new DbError(err);return n}throw new DbError('Não foi possível ler data/db.json ('+e.code+'). Nada foi alterado.','DB_READ')}
 if(!raw.trim())throw new DbError('data/db.json existe mas está vazio. O arquivo foi preservado; restaure um backup de data/backups/.','DB_EMPTY');
 let o;try{o=JSON.parse(raw)}catch{throw new DbError('data/db.json está corrompido (JSON inválido). O arquivo foi preservado sem alterações; restaure um backup de data/backups/.','DB_CORRUPT')}
 if(!isObj(o))throw new DbError('data/db.json tem formato inesperado. O arquivo foi preservado sem alterações.','DB_CORRUPT');
 if(o.v===2){const err=check(o);if(err)throw new DbError('data/db.json está incompleto/inválido: '+err+'. O arquivo foi preservado sem alterações; restaure um backup de data/backups/.','DB_INVALID');return o}
 if((o.v===undefined||(typeof o.v==='number'&&o.v<2))&&(o.admin||o.products||o.videos||o.orders||o.pix||o.door||o.log)){/* versão antiga: backup antes de migrar */const bk=copyTo('pre-migracao');const n=migrate(o);const err=check(n);if(err)throw new DbError('Falha ao migrar: '+err+'. Backup em '+bk);console.log('Banco antigo migrado. Backup em '+bk);n.__migrated=true;return n}
 throw new DbError('data/db.json tem versão desconhecida ('+String(o.v)+') ou não é um banco do GOLDREX. O arquivo foi preservado.','DB_VERSION')}
exports.get=()=>{if(db)return db;const d=load();const m=d.__migrated;delete d.__migrated;db=d;if(m||!fs.existsSync(F))exports.save();return db};
/* Gravação atômica com validação prévia e backups rotativos. Em caso de falha o arquivo original permanece intacto. */
exports.save=()=>{if(!db)throw new DbError('Banco não carregado.','DB_NOLOAD');const err=check(db);if(err)throw new DbError('Gravação recusada, estrutura inválida: '+err,'DB_INVALID');const text=JSON.stringify(db);
 try{JSON.parse(text)}catch{throw new DbError('Gravação recusada: serialização inválida.','DB_INVALID')}
 const now=Date.now();if(fs.existsSync(F)&&now-lastBk>10*60e3){try{copyTo('auto');lastBk=now;prune('db-auto-',20)}catch(e){/* backup é auxiliar: não impede a gravação */console.error('aviso: backup automático falhou:',e.message)}}
 try{writeAtomic(text)}catch(e){try{fs.unlinkSync(F+'.tmp')}catch{}throw new DbError('Falha ao gravar data/db.json ('+(e.code||e.message)+'). O arquivo anterior foi preservado.','DB_WRITE')}};
exports.backup=label=>copyTo(label);
exports.log=(a,d)=>{const x=exports.get();x.log.unshift({t:Date.now(),a,d:d||''});x.log=x.log.slice(0,300)};
