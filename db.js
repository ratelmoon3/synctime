require('dotenv').config({ quiet: true });
const { Pool } = require('pg');
let connectionString=process.env.DATABASE_URL;
// Preserve certificate verification for Neon's TLS connection.
if(connectionString){const url=new URL(connectionString);if(url.searchParams.get('sslmode')==='require')url.searchParams.set('sslmode','verify-full');connectionString=url.toString();}
const pool = new Pool({ connectionString, max: 3, connectionTimeoutMillis: 15000, idleTimeoutMillis: 10000 });
pool.on('error', () => console.error('Database pool connection failed.'));
module.exports = pool;
