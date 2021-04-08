const Boom = require('@hapi/boom');

exports.plugin = {
  name: 'authJwt',
  version: '1.0.0',
  register: async (server, options) => {
    const Jwt = require('@hapi/jwt');
    const { unHashPwd } = require('./util/unhash');
    await server.register(Jwt);
    server.auth.strategy('miBuen', 'jwt', {
      keys: server.app.config.jwtSecret,
      verify: {
        aud: 'miBuen@Yrk',
        iss: 'miBuen@Yrk',
        sub: false,
        nbf: true,
        exp: true,
        // maxAgeSec: 14400, // 4 hours
        timeSkewSec: 15,
      },
      validate: (artifacts, request, h) => {
        return {
          isValid: true,
          credentials: { user: artifacts.decoded.payload.user },
        };
      },
    });
    //server.auth.default('miBuen');
    server.route([
      {
        method: 'GET',
        path: '/users',
        handler: async (request, h) => {
          const users = await request.mongo.db.collection('users').find({}).toArray();
          return h.response(users);
        },
      },
      {
        method: 'GET',
        path: '/users/{userId}',
        handler: async (request, h) => {
          const { userId } = request.params;
          const user = await request.mongo.db.collection('users').findOne({ userId });
          //console.log('GET', request.auth.credentials);
          return h.response(user);
        },
      },
      {
        method: 'POST',
        path: '/login',
        handler: async (request, h) => {
          const { userId, password } = request.payload;
          try {
            const user = await request.mongo.db.collection('users').findOne({ userId: userId });
            if (user && (await unHashPwd(password, user.password))) {
              const token = Jwt.token.generate(
                {
                  aud: 'miBuen@Yrk',
                  iss: 'miBuen@Yrk',
                  user: user.userId,
                  group: user.tipoUsuario,
                },
                {
                  key: server.app.config.jwtSecret,
                  algorithm: 'HS512',
                },
                {
                  ttlSec: 14400, // 4 hour
                }
              );
              console.log(token);
              return h.response({ msg: token });
            }
            return Boom.badRequest('invalid credentials');
          } catch (error) {
            console.log(error);
          }
        },
        options: {
          auth: false,
        },
      },
    ]);
  },
};
