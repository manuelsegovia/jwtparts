const Boom = require('@hapi/boom');
const csv = require('csvtojson');
const fs = require('fs').promises;

const { transPart, manufPlate, makeDetails } = require('../helpers/dbHelpers');
const { steelPlateWeight } = require('../helpers/partSpecifics');

const { addDetail } = require('../helpers/dbHelpers');

const getPartsController = async (request, h) => {
	const criteria = request.query;
	try {
		const resp = await request.mongo.db
			.collection('partsMaster')
			.find(criteria)
			.toArray();
		const data = transPart(resp);
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
// mass Upload
const massUploadController = async (request, h) => {
	uploadFile = request.payload.csvFile;
	if (uploadFile === 'undefined') {
		return h.response({ message: ' no file was selected' });
	}
	const filejson = await csv({
		checkType: true,
		ignoreEmpty: true,
	}).fromString(uploadFile);
	const purParts = filejson.filter(
		(part) => part.origen.toLowerCase() === 'purchased'
	);
	const detailPurParts = addDetail(purParts);

	// add to mongo purchased parts
	const savedPurParts = async () => {
		try {
			const res = await request.mongo.db
				.collection('partsMaster')
				.insertMany(detailPurParts, { ordered: false });
			return { 'pur-skus': res.ops.length, 'pur-errors': 0 };
		} catch (error) {
			const x = error.writeErrors.map((element) => element.err.op.sku);
			await fs.writeFile('./temp/duplicates-pur.txt', x.toString());
			const msg = {
				'saved-pur-skus': error.result.result.nInserted,
				'pur-errors': error.writeErrors.length,
			};
			return msg;
		}
	};

	//Make Parts
	const makeParts = filejson.filter(
		(part) => part.origen.toLowerCase() === 'manufactured'
	);
	const dressParts = await makeDetails(makeParts, request);

	const savedMfgParts = async () => {
		try {
			const res = await request.mongo.db
				.collection('partsMaster')
				.insertMany(dressParts, { ordered: false });

			return { 'mfg-skus': res.ops.length, 'mfg-errors': 0 };
		} catch (error) {
			const x = error.writeErrors.map((element) => element.err.op.sku);

			await fs.writeFile('./temp/duplicates-mfg.txt', x.toString());
			const msg = {
				'saved-mfg-skus': error.result.result.nInserted,
				'mfg-errors': error.writeErrors.length,
			};
			//insertar errores a temp file
			return msg;
		}
	};
	return h
		.response({
			purparts: await savedPurParts(),
			makewithdetail: await savedMfgParts(),
		})
		.code(201);
};
module.exports = {
	getPartsController,
	addPartController,
	massUploadController,
};
