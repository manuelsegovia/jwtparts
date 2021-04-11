const {
	addPartController,
	getPartsController,
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

module.exports = [getParts, newPart];
