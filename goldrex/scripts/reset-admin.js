/* Recuperação de acesso ao painel, sem editar o banco à mão.
   Uso (com o servidor PARADO):  node scripts/reset-admin.js
   - valida o banco e faz um backup em data/backups/ antes de qualquer mudança;
   - remove SOMENTE os administradores e o código de troca; pedidos, atendentes, conteúdo e configurações ficam intactos;
   - depois, abra o painel e crie o novo administrador. Faça isso logo após reiniciar (a tela de criação fica aberta a quem acessar o painel). */
const DB=require('../lib/db');
try{
  const db=DB.get();
  const bk=DB.backup('pre-reset-admin');
  const n=db.admins.filter(a=>a.role==='admin').length;
  db.admins=db.admins.filter(a=>a.role!=='admin');db.rec=null;
  DB.log('recuperação','administradores removidos via scripts/reset-admin.js');
  DB.save();
  console.log('Pronto. '+n+' administrador(es) removido(s). Backup: '+bk+'\nInicie o servidor e crie o novo administrador no painel.');
}catch(e){console.error('Nada foi alterado. '+e.message);process.exit(1)}
