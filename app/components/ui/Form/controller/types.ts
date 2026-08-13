import type {
  FieldValues,
  FieldPath,
  UseFormReturn,
  Path,
} from 'react-hook-form';

import type { ReactElement } from 'react';

/**
 * @param name One of the registered names of the form
 * Note: The TS typing doesn't account for the registered/non-registered nature of the name based on the `Schema` passed into `Form`
 * @param nextInputToFocus One of the registered names of the form
 */

type HandledFormElementProps<FormValues extends FieldValues> = {
  name: FieldPath<FormValues>;
  nextInputToFocus?: Path<FormValues>;
  errormessage?: string;
};

type ValidInputValue = string | boolean | number;
type RequiredSchema = Record<string, ValidInputValue>;

/**
 * @param methods UseFormReturn<Schema>
 * @param children ReactElement | ReactElement[]
 * @param loggingMode A setting for when helpful logging messages should be displayed in the console @default 'only first render'
 * @returns Fragment of `children` injected with react-hook-form methods
 * @param props.shouldAutoFocusNextRegisteredInput [React Native only] Should the Form automatically try to set `onSubmitEditing` of the auto-registered that follows a given input. Note that the `nextInputToFocus` prop passed into a component created by `createHandledFormElement` will override this setting. @default true
 */
type FormControllerProps<Schema extends RequiredSchema> = {
  methods: UseFormReturn<Schema>;
  children: ReactElement | ReactElement[];
  loggingMode?: 'always' | 'only first render' | 'never';
  shouldAutoFocusNextRegisteredInput?: boolean;
};

export type { RequiredSchema, FormControllerProps, HandledFormElementProps };
