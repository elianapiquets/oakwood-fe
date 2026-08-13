import type { HandledFormElementProps } from './types';
import type { FieldValues } from 'react-hook-form';

import { memo, forwardRef } from 'react';
import type { FC } from 'react';

/**
 * Creates a component that will be auto-registered with `react-hook-form` via `name` prop
 * @param WrappedComponent component to add additional props to
 * @returns component with additional props added (name, nextInputToFocus)
 */
const createHandledFormElement = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component extends FC<any>,
  SchemaType extends FieldValues,
>(
  WrappedComponent: Component,
) => {
  type Props = Parameters<Component>[0] & HandledFormElementProps<SchemaType>;

  const MemoizedComponent = memo(
    forwardRef<unknown, Props>((props, _ref) => (
      <WrappedComponent {...props} />
    )),
  );

  MemoizedComponent.displayName = `Handled(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return MemoizedComponent;
};

/**
 * Gets the name of the next input to focus
 * @param allChildrenWithNames names of all `children` passed to Form to be auto-registered with `react-hook-form` via `name` prop
 * @param currentChildName name of current child being mapped over
 * @returns Path<FieldValues> | undefined
 */
const getNextInputName = (
  allChildrenWithNames: string[],
  currentChildName: string,
) => {
  const indexOfCurrentChild = allChildrenWithNames.indexOf(currentChildName);
  const nextIndex = indexOfCurrentChild > -1 ? indexOfCurrentChild + 1 : -1;

  if (nextIndex === -1) {
    return undefined;
  }

  return allChildrenWithNames[nextIndex];
};

// Given that this is a React library, we don't want to use anything from `react-native`, i.e. Platform
const IS_WEB = typeof window !== 'undefined' && typeof document !== 'undefined';

export { createHandledFormElement, getNextInputName, IS_WEB };
