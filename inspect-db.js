const pool = require('./db');
(async () => { try {
 if (!process.env.DATABASE_URL) throw Error('DATABASE_URL is missing');
 const { rows } = await pool.query("SELECT table_name,column_name,data_type,is_nullable,column_default,is_identity FROM information_schema.columns WHERE table_schema='public' AND table_name = ANY($1) ORDER BY table_name,ordinal_position", [['groups','participants','availability','places','events','event_participants']]);
 console.log(JSON.stringify(rows,null,2));
} catch (e) { console.error('Database inspection failed:', e.code || 'connection unavailable'); process.exitCode=1; } finally { await pool.end(); } })();

