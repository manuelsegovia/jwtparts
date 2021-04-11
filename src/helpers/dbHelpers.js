const { steelPlateWeight } = require('./weightCalc');
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
const findPart = async (criteria, request) => {
	console.log(criteria);
	const part = await request.mongo.db
		.collection('partsMaster')
		.findOne(criteria);
	console.log(part);
	return part;
};

const manufPlate = async (request) => {
	const part = request.payload;
	if (part.category === 'plate') {
		const criteria = { thicknessIn: part.thicknessIn };
		console.log('CRITERIA', criteria);
		const raw = await request.mongo.db
			.collection('partsMaster')
			.findOne(criteria);

		const blankWeightLbs = steelPlateWeight(
			part.thicknessIn,
			part.widthIn,
			part.lengthIn
		);
		const { widthIn, lengthIn, sku } = raw;
		const rawArea = widthIn * lengthIn;
		const partArea = part.widthIn * part.lengthIn;
		const qty = 1 / Math.floor(rawArea / partArea);
		part.blankWeightLbs = blankWeightLbs;
		const rawMaterial = { sku: sku, qty: qty };
		part.rawMaterial = rawMaterial;

		return part;
	}
	if (part.category === 'pipe') {
		const criteria = {
			diameterIn: part.diameterIn,
			thicknessIn: part.thicknessIn,
			seamless: part.seamless,
		};
		const raw = await request.mongo.db
			.collection('partsMaster')
			.findOne(criteria);
		const { lengthIn, weightLbs, sku } = raw;
		const blankWeightLbs = (weightLbs * part.lengthIn) / lengthIn;
		const qty = 1 / Math.floor(lengthIn / part.lengthIn);
		const rawMaterial = { sku: sku, qty: qty };
		part.blankWeightLbs = blankWeightLbs;
		part.rawMaterial = rawMaterial;
		return part;
	}
};

module.exports = {
	transPart,
	findPart,
	manufPlate,
};
