import * as v from "valibot";

const json = v.object({
	duration: v.optional(v.pipe(v.number(), v.minValue(2), v.maxValue(60))),
	prompt: v.pipe(v.string(), v.minLength(10), v.maxLength(400)),
});

export { json };
