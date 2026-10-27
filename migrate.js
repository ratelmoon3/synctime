const fs = require('node:fs');
const pool = require('./db');
(async()=>{try{await pool.query(fs.readFileSync(require('node:path').join(__dirname,'migrations/001-app-fields.sql'),'utf8'));console.log('SyncTime migration applied. Existing rows retained.');}catch(e){console.error('Migration failed:',e.code||'connection unavailable');process.exitCode=1;}finally{await pool.end();}})();
