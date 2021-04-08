const Hapi = require('@hapi/hapi');

const createServer = async (config) => {
	const { host, port } = config;
	//console.log(host, port);
	const server = Hapi.server({
		host,
		port,
		routes: {
			//cors: true,
			origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
			validate: {
				failAction: async (request, h, error) =>
					error.isJoi
						? h.response(error.details).takeover()
						: h.response(error).takeover(),
			},
		},
	});

	server.app.config = config;
	await server.register(require('./plugins'));
	server.auth.default('miBuen');
	server.route(require('./routes'));
	return server;
};

module.exports = {
	createServer,
};
