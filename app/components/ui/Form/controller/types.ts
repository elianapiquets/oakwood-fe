/**
 * The shape a form schema has to satisfy. Kept from the v1 controller, which is
 * otherwise gone — `FormController2` uses it as its generic bound.
 */
type ValidInputValue = string | boolean | number;
type RequiredSchema = Record<string, ValidInputValue>;

export type {RequiredSchema};
