const crypto = require('crypto');

function isValidPassword(inputPassword, storedHash) {
  const hashedInput = crypto.createHash('md5').update(inputPassword).digest('hex').toUpperCase();
  return hashedInput === storedHash;
}

module.exports = {isValidPassword};