const Bcrypt = require('bcrypt');

const unHashPwd = async (tryPassword, hashedPasswordOnRecord) => Bcrypt.compare(tryPassword, hashedPasswordOnRecord);
module.exports = {
  unHashPwd,
};
