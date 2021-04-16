const {
	addPartController,
	getPartsController,
} = require('../controllers/partsControllers');
const csvjson = require('csvjson');
const fs = require('fs');

const { partSchema } = require('../schemas/partSchema');
const { steelPlateWeight } = require('../helpers/weightCalc');

const getParts = {
	method: 'GET',
	path: '/parts',
	handler: getPartsController,
};
const newPart = {
	method: 'POST',
	path: '/parts',
	options: {
		validate: {
			payload: partSchema,
		},
	},
	handler: addPartController,
};
const massUpload = {
	method: 'POST',
	path: '/upload',
	options: {
		payload: {
			output: 'data',
			parse: true,
			multipart: true,
			maxBytes: 10 * 1024 * 1024,
		},
		description: 'mass upload',
	},
	handler: async (request, h) => {
		const uploadFile = request.payload.csvFile;
		const filejson = csvjson.toObject(uploadFile);

		const y = await filejson.map((part) => {
			const weightLbs = steelPlateWeight(
				part.thicknessIn,
				part.widthIn,
				part.lengthIn
			);
			part.weightLbs = weightLbs;
			return part;
		});

		try {
			const insertedParts = await request.mongo.db
				.collection('partsMaster')
				.insertMany(y, { ordered: false });

			return insertedParts;
		} catch (error) {
			const duplicated = error.writeErrors.map((element) => {
				return element.err.op.sku;
			});
			fs.writeFile(`./temp/duplicated.txt`, duplicated.toString(), (err) => {
				if (err) {
					console.log('ERRTEMP', err);
					return;
				}
			});
			return h.response({ Invalid: duplicated });
		}
	},
};

module.exports = [getParts, newPart, massUpload];
