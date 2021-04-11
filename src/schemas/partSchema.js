const { forbidden } = require('@hapi/boom');
const Joi = require('joi');
const partSchema = Joi.object({
	sku: Joi.string().min(6).max(16).required(),
	description: Joi.string().trim().required(),
	category: Joi.string().required(),
	material: Joi.string().required(),
	weightLbs: Joi.number(),
	umUsage: Joi.string(),
	origen: Joi.valid('purchased', 'manufactured').required(),
	shape: Joi.valid('round', 'rectangular').when('origen', {
		is: 'purchased',
		then: Joi.required(),
		otherwise: Joi.forbidden(),
	}),
	// rawMaterial: Joi.object()
	// 	.keys({
	// 		sku: Joi.string().min(6).max(16).required(),
	// 		qty: Joi.number().required(),
	// 	})
	// 	.when('origen', {
	// 		is: 'manufactured',
	// 		then: Joi.required(),
	// 		otherwise: Joi.forbidden(),
	// 	}),
	umPur: Joi.when('origen', {
		is: 'purchased',
		then: Joi.string().required(),
		otherwise: Joi.forbidden(),
	}),
	type: Joi.string().when('origen', {
		is: 'manufactured',
		then: Joi.required(),
		otherwise: Joi.forbidden(),
	}),
	blankWeightLbs: Joi.when('origen', {
		is: 'manufactured',
		then: Joi.number(),
		otherwise: Joi.forbidden(),
	}),
	lengthIn: Joi.number().required(),
	drawing: Joi.string().when('origen', {
		is: 'manufactured',
		then: Joi.required(),
		otherwise: Joi.forbidden(),
	}),
	specFile: Joi.string().when('origen', {
		is: 'purchased',
		then: Joi.required(),
		otherwise: Joi.forbidden(),
	}),
	widthIn: Joi.when('category', {
		is: 'plate',
		then: Joi.number(),
		otherwise: Joi.forbidden(),
	}),
	diameterIn: Joi.when('category', {
		is: 'pipe',
		then: Joi.string(),
		otherwise: Joi.forbidden(),
	}),
	coated: Joi.when('category', {
		is: 'pipe',
		then: Joi.string(),
		otherwise: Joi.forbidden(),
	}),
	seamless: Joi.when('category', {
		is: 'pipe',
		then: Joi.boolean(),
		otherwise: Joi.forbidden(),
	}),

	thicknessIn: Joi.when('origen', {
		is: 'purchased',
		then: Joi.required(),
		//otherwise: Joi.forbidden(),
	}).when('category', {
		is: 'pipe',
		then: Joi.string(),
		otherwise: Joi.number(),
	}),
}).options({
	allowUnknown: true,
	abortEarly: false,
	cache: false,
});

module.exports = {
	partSchema,
};
