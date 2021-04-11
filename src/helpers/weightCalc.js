const steelPlateWeight = (thck, width, length) =>
	0.2855 * thck * width * length;

module.exports = {
	steelPlateWeight,
};
