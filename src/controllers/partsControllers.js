const Boom = require('@hapi/boom');
const csv = require('csvtojson');
const fs = require('fs/promises');

const { makeDetails } = require('../helpers/dbHelpers');
const { steelPlateWeight } = require('../helpers/partSpecifics');

const { addDetail } = require('../helpers/dbHelpers');

const getPartsController = async (request, h) => {
	const criteria = request.query;
	try {
		const resp = await request.mongo.db
			.collection('partsMaster')
			.find(criteria)
			.toArray();
		return h.response(resp).code(200);
	} catch (error) {
		console.log(error);
	}
};
const addPartController = async (request, h) => {
	const { origen, category, thicknessIn, widthIn, lengthIn } = request.payload;

	if (origen === 'purchased' && category === 'plate') {
		request.payload.weigthLbs = steelPlateWeight(
			thicknessIn,
			widthIn,
			lengthIn
		);
	}
	try {
		const part = await request.mongo.db
			.collection('partsMaster')
			.insertOne(request.payload);
		return h.response(part.insertedId).code(201);
	} catch (error) {
		throw Boom.badRequest('duplicate part');
	}
};
//+++++++++++ mass Upload+++++++++++++++++++++++
const massUploadController = async (request, h) => {
	try {
		const x = await fs.access('./temp/notsaved.txt');
		await fs.unlink('./temp/notsaved.txt');
	} catch (error) {
		console.log(error);
	}

	const uploadFile = request.payload.csvFile;
	if (!uploadFile) {
		throw Boom.unsupportedMediaType(
			'file must be csv type and smaller than 10MB'
		);
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
	const savedPurParts = async (partsToSave) => {
		try {
			const res = await request.mongo.db
				.collection('partsMaster')
				.insertMany(partsToSave, { ordered: false });
			const msg = {
				savedSkus: res.ops.length,
				notSavedSkus: 0,
				listNotSaved: [],
			};
			return msg;
		} catch (error) {
			const x = error.writeErrors.map((element) => element.err.op.sku);
			const msg = {
				savedSkus: error.result.result.nInserted,
				notSavedSkus: error.writeErrors.length,
				listNotSaved: x,
			};
			return msg;
		}
	};

	//Make Parts

	const makeParts = filejson.filter(
		(part) => part.origen.toLowerCase() === 'manufactured'
	);

	const detailMfgParts = await makeDetails(makeParts, request);

	const saveAll = async () => {
		const finalResult = {};
		if (detailPurParts.length > 0 && makeParts.length > 0) {
			const msgPur = await savedPurParts(detailPurParts);
			if (msgPur) {
				const msgMfg = await savedPurParts(detailMfgParts);
				for (const key in msgPur) {
					if (key === 'listNotSaved') {
						finalResult['listNotSaved'] = [
							...msgPur.listNotSaved,
							...msgMfg.listNotSaved,
						];
					}
					finalResult[key] = msgPur[key] + msgMfg[key];
				}
				return finalResult;
			}
		}
		if (detailPurParts.length > 0) {
			return savedPurParts(detailPurParts);
		}
		if (makeParts.length > 0) {
			return savedPurParts(detailMfgParts);
		}
	};

	const resMsg = await saveAll();
	const { savedSkus, notSavedSkus, listNotSaved } = resMsg;
	console.log('listNotSaved', listNotSaved);
	if (listNotSaved.length > 0) {
		await fs.writeFile('./temp/notsaved.txt', listNotSaved.toString());
	}

	return h.response({ savedSkus, notSavedSkus }).code(201);
};
//++++++++End Mass Upload
//++++++Mfg Skus missing raw material++++++
const includeRawToMfgController = async (request, h) => {
	criteria = {
		origen: 'manufactured',
		$or: [{ rawMat: null }, { rawMat: { rawMaterial: 'notExistent' } }],
	};
	//	console.log('criteria', criteria);
	try {
		const notExistent = await request.mongo.db
			.collection('partsMaster')
			.find(criteria)
			.toArray();

		if (notExistent.length === 0) {
			return h.response({
				message: '0 mfg parts missing raw material',
			});
		}
		const addRaw = await makeDetails(notExistent, request);
		console.log('ADDRAW', addRaw);

		const saveMfgPart = await Promise.all(
			addRaw.map(async (part) => {
				if (part.rawMat.rawMaterial === 'notExistent') {
					return { sku: part.sku, rawMat: part.rawMat.rawMaterial }; //  resolve mensaje
				}
				const x = await request.mongo.db
					.collection('partsMaster')
					.updateOne(
						{ _id: part._id, origen: 'manufactured' },
						{ $set: { rawMat: part.rawMat } }
					);
				if (x.result.nModified === 1) {
					return { sku: part.sku, rawMat: part.rawMat };
				}
				/// find the way to combine
			})
		);
		return h.response({ parts: saveMfgPart });
	} catch (error) {
		throw Boom.notFound();
	}
};
const listMissingRawController = async (request, h) => {
	criteria = {
		origen: 'manufactured',
		$or: [{ rawMat: null }, { rawMat: { rawMaterial: 'notExistent' } }],
	};
	// const criteria = { rawMat: { rawMaterial: 'notExistent' } };
	//console.log(criteria);
	try {
		const notExistent = await request.mongo.db
			.collection('partsMaster')
			.find(criteria)
			.toArray();
		return h.response(notExistent);
	} catch (error) {
		throw Boom.notFound('0 mfg parts missing raw material');
	}
};
module.exports = {
	getPartsController,
	addPartController,
	massUploadController,
	includeRawToMfgController,
	listMissingRawController,
};
