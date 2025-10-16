
const sql = require('mssql');
require('dotenv').config()

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

const pool = new sql.ConnectionPool(config);

const poolConnect = pool.connect()
  .then(() => {
    console.log('✅ MSSQL Database connected successfully!');
  })
  .catch(err => {
    console.error('❌ MSSQL Database connection failed:', err);
  });


pool.on('error', err => {
  console.error('SQL errors', err);
});


module.exports = {
  sql,
  poolConnect,
  pool
}