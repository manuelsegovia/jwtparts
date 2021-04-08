const { server } = require('@hapi/hapi');
const optionsLaabr = {
  formats: {
    onPostStart: ':time :start :level :message',
    log: false,
  },
  tokens: { start: () => '[start]' },
  indent: 0,
  colored: true,
};

exports.plugin = {
  name: 'index',
  version: '1.0.0',
  register: async (server, options) => {
    await server.register([
      { plugin: require('blipp') },
      {
        plugin: require('laabr'),
        optionsLaabr,
      },
      { plugin: require('./mongoPlugin') },
      { plugin: require('./auth') },
    ]);
  },
};
