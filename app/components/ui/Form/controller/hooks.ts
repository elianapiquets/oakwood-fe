import type { FormControllerProps } from './types';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

import type { ReactElement } from 'react';
import { useEffect, Children, useRef } from 'react';

// Define a type for the props we access on child elements
type ChildProps = {
  name?: string;
  [key: string]: unknown;
};

const findDuplicateStrings = (arr: string[]): string[] => {
  const duplicates: string[] = [];
  const strings = new Set<string>();

  for (const str of arr) {
    if (strings.has(str)) {
      duplicates.push(str);
    } else {
      strings.add(str);
    }
  }

  return duplicates;
};

/**
 *
 * @param children ReactElement | ReactElement[]
 * @param methods useForm methods
 * @param loggingMode A setting for when helpful logging messages should be displayed in the console @default 'only first render'
 */
const useCheckForProperFormUsage = <Schema extends FieldValues>(
  children: ReactElement | ReactElement[],
  methods: UseFormReturn<Schema>,
  loggingMode: FormControllerProps<never>['loggingMode'],
) => {
  const renderCount = useRef(0);

  useEffect(() => {
    const allFieldNames = Object.keys(methods.getValues());

    const allNamesFromChildren = Children.map(children, (child) => {
      const typedChild = child as ReactElement<ChildProps>;

      if (typeof typedChild.props.name !== 'string') {
        return null;
      }

      return typedChild.props.name;
    }).filter((maybeName) => typeof maybeName === 'string');

    const uniqueNames = [...new Set(allNamesFromChildren)];

    if (allNamesFromChildren.length !== uniqueNames.length) {
      const duplicates = findDuplicateStrings(allNamesFromChildren).join(', ');

      throw Error(
        `All 'name' properties on Form's children must be unique! Duplicates: ${duplicates}`,
      );
    }

    if (
      loggingMode === 'never' ||
      (loggingMode === 'only first render' && renderCount.current > 1)
    ) {
      return;
    }

    const manuallyControlledFields = allFieldNames.filter(
      (fieldName) => !uniqueNames.includes(fieldName),
    );

    console.log(`[Form] There are no duplicate 'name' properties on Form's 'children'. Form is being used correctly!

    The following fields will be automatically registered with 'react-hook-form': [${uniqueNames.join(
      ', ',
    )}].

    All other fields in the Schema must be dealt with manually: [${manuallyControlledFields.join(
      ', ',
    )}]`);
  }, [children, loggingMode, methods]);

  renderCount.current += 1;
};

export { useCheckForProperFormUsage };
