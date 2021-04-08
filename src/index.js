const config = require('./config');

const { createServer } = require('./app');
const startServer = async () => {
  const server = await createServer(config);
  await server.start();
  console.log('ya chingamos', server.info.uri);
};
process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});
startServer();
