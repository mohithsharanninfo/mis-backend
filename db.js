
const sql = require('mssql');

const config = {
  user: 'Magnaapp',
  password: 'magna2012',
  server: '123.253.10.200',
  database: 'MagnaCentralizeLatest',
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