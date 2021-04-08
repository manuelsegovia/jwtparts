const dotenv = require('dotenv');

dotenv.config();

const {
  NODE_ENV,
  PORT,
  HOST,

  MONGO,
  JWT_SECRET,
} = process.env;

module.exports = {
  nodeEnv: NODE_ENV,
  port: PORT,
  host: HOST,
  mongoDb: MONGO,
  jwtSecret: JWT_SECRET,
};
