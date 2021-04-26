const {
	addPartController,
	getPartsController,
	massUploadController,
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
			output: 'data',
			parse: true,
			multipart: true,
			maxBytes: 10 * 1024 * 1024,
		},
		description: 'mass upload',
	},
	handler: massUploadController,
};

module.exports = [getParts, newPart, massUpload];
