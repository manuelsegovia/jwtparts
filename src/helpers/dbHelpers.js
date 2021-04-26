const { steelPlateWeight, qtyArea, qtyLength } = require('./partSpecifics');

const addDetail = (purParts) => {
	return purParts.map((purPart) => {
		if (purPart.category.toLowerCase() === 'plate') {
			return {
				...purPart,
				weight: steelPlateWeight(
					purPart.thicknessIn,
					purPart.widthIn,
					purPart.lengthIn
				),
			};
		}
		return { ...purPart };
	});
};
const insertCriteria = (part) => {
	const { category, thicknessIn, dia, specFile, widthIn, lengthIn } = part;
	const criteria = {};
	if (part.category === 'plate') {
		criteria.category = category;
		criteria.thicknessIn = thicknessIn;
		criteria.specFile = specFile;
	}
	if (category === 'pipe') {
		criteria.category = category;
		criteria.dia = dia;
		criteria.thicknessIn = thicknessIn;
		criteria.specFile = specFile;
	}
	return criteria;
};

const makeDetails = async (makeParts, request) => {
	const result = await Promise.all(
		makeParts.map(async (make) => {
			const { category, thicknessIn, dia, specFile, widthIn, lengthIn } = make;

			const criteria = insertCriteria(make);
			if (Object.keys(criteria).length === 0) {
				return { ...make };
			}
			const raw = await request.mongo.db
				.collection('partsMaster')
				.find(criteria)
				.toArray();
			if (raw.length === 0) {
				return { ...make, rawMat: { 'raw material': 'not existent' } };
			}
			const rawMat = [];
			raw.forEach((part) => {
				if (part.category === 'plate') {
					const qty = qtyArea(part.widthIn, part.lengthIn, widthIn, lengthIn);
					const blankWeightLbs = qty * part.weight;
					rawMat.push({
						sku: part.sku,
						qty,
						blankWeightLbs,
					});
				}
				if (part.category === 'pipe') {
					const qty = qtyLength(lengthIn, part.lengthIn);
					rawMat.push({
						sku: part.sku,
						qty,
					});
				}
			});
			//console.log({ ...make, rawMat });
			return { ...make, rawMat };
		})
	);
	//console.log('INSIDE', result);
	return result;
};

module.exports = {
	addDetail,
	insertCriteria,
	makeDetails,
};
