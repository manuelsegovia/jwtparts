const {
	addPartController,
	getPartsController,
	massUploadController,
	includeRawToMfgController,
	listMissingRawController,
} = require('../controllers/partsControllers');

const { partSchema } = require('../schemas/partSchema');

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
			//allow: ['multipart/form-data'],
			output: 'data',
			parse: true,
			multipart: true,
			maxBytes: 10 * 1024 * 1024,
		},
		description: 'mass upload',
	},
	handler: massUploadController,
};
const missingRaw = {
	method: 'GET',
	path: '/includeraw',
	handler: includeRawToMfgController,
};
const listMissingRaw = {
	method: 'GET',
	path: '/listmissing',
	handler: listMissingRawController,
	options: {
		description: 'get Mfg parts without raw Mat',
	},
};
module.exports = [getParts, newPart, massUpload, missingRaw, listMissingRaw];
