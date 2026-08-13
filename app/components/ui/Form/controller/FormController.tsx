'use client';

import type { FormControllerProps, RequiredSchema } from './types';
import type { Path } from 'react-hook-form';

import type { ReactElement } from 'react';
import { Children, createElement } from 'react';

import { Controller } from 'react-hook-form';

import { useCheckForProperFormUsage } from './hooks';

// Define a type for the props we access on child elements
type ChildProps = {
  name?: string;
  nextInputToFocus?: string;
  onSubmitEditing?: (data?: unknown) => void;
  onBlur?: (e: unknown) => void;
  returnKeyType?: string;
  disabled?: boolean;
};

/**
 * @param props FormControllerProps<Schema>
 * @param props.methods UseFormReturn<Schema>
 * @param props.children ReactElement | ReactElement[]
 * @param props.loggingMode A setting for when helpful logging messages should be displayed in the console @default 'only first render'
 * @returns Fragment of `children` injected with react-hook-form methods
 */
const FormController = <Schema extends RequiredSchema>({
  methods,
  children,
  loggingMode = 'only first render',
}: FormControllerProps<Schema>) => {
  useCheckForProperFormUsage(children, methods, loggingMode);

  return (
    <>
      {Children.map(children, (child) => {
        // Cast child to ReactElement with our ChildProps interface
        const typedChild = child as ReactElement<ChildProps>;
        const currentChildName = typedChild.props.name;

        if (!currentChildName) {
          return child;
        }

        const errormessage =
          methods.formState.errors[
            currentChildName as keyof typeof methods.formState.errors
          ]?.message;
        const defaultValue =
          methods.formState.defaultValues?.[
            currentChildName as keyof typeof methods.formState.defaultValues
          ];

        return (
          <Controller
            control={methods.control}
            name={currentChildName as Path<Schema>}
            render={({ field: { name, onBlur, onChange, ...rest } }) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const handleOnBlur = (e: any) => {
                if (typedChild.props.onBlur) {
                  typedChild.props.onBlur(e);
                }

                onBlur();
              };

              return createElement(typedChild.type, {
                ...typedChild.props,
                onBlur: handleOnBlur,
                onChange,
                errormessage,
                defaultValue,
                ...rest,
                disabled: typedChild.props.disabled ?? rest.disabled,
              });
            }}
          />
        );
      })}
    </>
  );
};

export { FormController };
