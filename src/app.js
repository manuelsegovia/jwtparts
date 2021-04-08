const Hapi = require('@hapi/hapi');

const createServer = async (config) => {
	const { host, port } = config;
	//console.log(host, port);
	const server = Hapi.server({
		host,
		port,
		routes: {
			cors: {
				origin: ['http://localhost:5500'],
				headers: ['Authorization'],
			},

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
