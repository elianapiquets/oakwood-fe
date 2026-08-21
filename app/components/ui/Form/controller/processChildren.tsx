import type {ReactElement, ReactNode} from 'react';
import {Children, createElement, isValidElement, Fragment} from 'react';

type AdditionalProps = Record<string, unknown>;

/**
 * Clones each element child with `additionalProps` merged in.
 *
 * Own props are spread **last**, so a prop written in JSX always beats an
 * injected one — that's what lets a call site override, say, `disabled`.
 *
 * Non-elements pass through untouched — text, null, and the `undefined` that a
 * JSX comment line evaluates to. Note it does not recurse: only direct children are
 * injected into, so a field has to be an immediate child of its `Form.Item`.
 *
 * Moved here from `Form.tsx` so `FormController` can use it without importing
 * from the component it renders inside.
 */
export function processChildren(
  children: ReactNode,
  additionalProps: AdditionalProps,
): ReactNode {
  return Children.map(children, (child) => {
    if (isValidElement(child) && child.type !== Fragment) {
      const {type, props} = child as ReactElement;

      if (typeof props === 'object' && props !== null) {
        return createElement(type, {
          ...additionalProps,
          ...props,
        });
      }
    }

    return child;
  });
}
