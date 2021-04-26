const steelPlateWeight = (thck, width, length) =>
	0.2855 * thck * width * length;

const qtyArea = (partW, partL, rawW, rawL) => {
	return 1 / Math.floor((partW * partL) / (rawW * rawL));
};
const qtyLength = (partL, rawL) => 1 / Math.floor(rawL / partL);
module.exports = {
	steelPlateWeight,
	qtyArea,
	qtyLength,
};
