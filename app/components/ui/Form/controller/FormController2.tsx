import type {RequiredSchema} from './types';
import type {Path, UseFormReturn} from 'react-hook-form';

import type {ReactNode} from 'react';

import {Controller} from 'react-hook-form';

import {processChildren} from './processChildren';

type FormController2Props<Schema extends RequiredSchema> = {
  methods: UseFormReturn<Schema>;
  /**
   * The field this group is bound to. Supplied by `Form2.Item`, not read off a
   * child — that inversion is the whole difference from v1's `FormController`,
   * where each child carried its own `name`.
   */
  name: Path<Schema>;
  children?: ReactNode;
};

/**
 * Binds one react-hook-form field and hands its state to every child.
 *
 * Opens a single `<Controller>` for `name` and injects the field props into the
 * children, so a `Form2.Item` can hold a label, a control and an error message
 * and have each receive what it needs.
 *
 * `defaultValue` is deliberately not injected: passing it alongside `value`
 * makes React warn when both land on a DOM input, and `field.value` already
 * reflects `defaultValues`.
 *
 * Note `processChildren` does not recurse — only an Item's direct children are
 * injected into — and it spreads own props last, so a child that writes its own
 * `onChange` or `onBlur` in JSX replaces the injected one.
 */
const FormController2 = <Schema extends RequiredSchema>({
  methods,
  name,
  children,
}: FormController2Props<Schema>) => (
  <Controller
    control={methods.control}
    name={name}
    render={({field: {onBlur, onChange, value, disabled}}) => {
      const errormessage = methods.formState.errors[
        name as keyof typeof methods.formState.errors
      ]?.message as string | undefined;

      return (
        <>
          {processChildren(children, {
            name,
            value,
            onChange,
            disabled,
            errormessage,
            hasError: Boolean(errormessage),
            // `processChildren` spreads own props last, so a child that writes
            // its own `onBlur` in JSX replaces this one and rhf stops seeing
            // blur (losing touched state). Compose at the call site if a field
            // needs both.
            onBlur,
          })}
        </>
      );
    }}
  />
);

export {FormController2};
export type {FormController2Props};
