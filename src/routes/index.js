const Boom = require('@hapi/boom');

const { partSchema } = require('../schemas/partSchema');
const transPart = (resp) => {
	const data = resp.map((part) => {
		if (part.origen === 'manufactured') {
			const { qty } = part.rawMaterial;
			const raw = resp.find((ele) => ele.sku === part.rawMaterial.sku);
			part.rawMaterial = { ...raw };
			part.rawMaterial.qty = qty;
		}
		return part;
	});
	return data;
};

const getParts = {
	method: 'GET',
	path: '/parts',
	handler: async (request, h) => {
		const criteria = request.query;
		try {
			const resp = await request.mongo.db
				.collection('partsMaster')
				.find(criteria)
				.toArray();
			const data = transPart(resp);
			console.log(data);
			return h.response(data).code(200);
		} catch (error) {
			console.log(error);
		}
	},
};
const newPart = {
	method: 'POST',
	path: '/parts',
	options: {
		validate: {
			payload: partSchema,
		},
	},
	handler: async (request, h) => {
		try {
			const part = await request.mongo.db
				.collection('partsMaster')
				.insertOne(request.payload);
			return h.response(part.insertedId).code(201);
		} catch (error) {
			throw Boom.badRequest('duplicate part');
		}
	},
};

module.exports = [getParts, newPart];
