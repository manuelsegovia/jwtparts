const { steelPlateWeight, qtyArea, qtyLength } = require('./partSpecifics');

const addDetail = (purParts) => {
	return purParts.map((purPart) => {
		const { thicknessIn, widthIn, lengthIn } = purPart;
		if (purPart.category.toLowerCase() === 'plate') {
			return {
				...purPart,
				weight: steelPlateWeight(thicknessIn, widthIn, lengthIn),
			};
		}
		return { ...purPart };
	});
};
const insertCriteria = (part) => {
	const { category, thicknessIn, dia, specFile, widthIn, lengthIn } = part;

	if (category === 'plate') {
		criteria = { origen: 'purchased', category, thicknessIn, specFile };
	}
	if (category === 'pipe') {
		criteria = { origen: 'purchased', category, dia, thicknessIn, specFile };
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
				return { ...make, rawMat: { rawMaterial: 'notExistent' } };
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
			return { ...make, rawMat };
		})
	);

	return result;
};

module.exports = {
	addDetail,
	insertCriteria,
	makeDetails,
};
