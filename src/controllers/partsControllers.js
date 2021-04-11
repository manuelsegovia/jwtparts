const Boom = require('@hapi/boom');
const { transPart, manufPlate } = require('../helpers/dbHelpers');
const { steelPlateWeight } = require('../helpers/weightCalc');

const getPartsController = async (request, h) => {
	const criteria = request.query;
	console.log(criteria);
	try {
		const resp = await request.mongo.db
			.collection('partsMaster')
			.find(criteria)
			.toArray();
		const data = transPart(resp);
		//console.log(data);
		return h.response(data).code(200);
	} catch (error) {
		console.log(error);
	}
};
const addPartController = async (request, h) => {
	const { origen } = request.payload;
	const data =
		origen === 'purchased' ? request.payload : await manufPlate(request);
	if (data.origen === 'purchased' && data.category === 'plate') {
		data.weigthLbs = steelPlateWeight(
			data.thicknessIn,
			data.widthIn,
			data.lengthIn
		);
	}
	try {
		const part = await request.mongo.db
			.collection('partsMaster')
			.insertOne(data);
		return h.response(part.insertedId).code(201);
	} catch (error) {
		throw Boom.badRequest('duplicate part');
	}
};

module.exports = {
	getPartsController,
	addPartController,
};
