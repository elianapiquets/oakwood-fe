import type {FieldValues, UseFormReturn, Path} from 'react-hook-form';

import type {ReactElement, ReactNode} from 'react';
import React, {Children, createElement, isValidElement, Fragment} from 'react';

import {clsx} from 'clsx';

import {FormController} from './controller';
import {ErrorTextForm} from './ErrorTextForm';
import {Typography} from '../Typography';
import {Input} from '../Input';
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../Select';
import {Textarea} from '../Textarea';

type FooterProps = {
  children?: ReactNode;
  className?: string;
  horizontalAligment?: 'start' | 'center' | 'end';
};

type ErrorProps = {
  className?: string;
  errormessage?: string;
};

type ItemProps = {
  children?: ReactElement | ReactElement[];
  className?: string;
  name?: Path<FieldValues>;
  errorMessage?: 'string';
};

type LabelProps = {
  children?: ReactNode;
  label?: string;
  name?: string;
  required?: boolean;
  colon?: boolean;
  htmlFor?: string;
  className?: string;
};

type FormProps<TFieldValues extends FieldValues> = {
  children: ReactElement | ReactElement[];
  className?: string;
  methods: UseFormReturn<TFieldValues>;
  loggingMode?: 'always' | 'only first render' | 'never';
  onSubmit?: (event?: React.FormEvent<HTMLFormElement>) => void;
  as?: React.ElementType;
};

type DivProps = {
  children?: ReactElement | ReactElement[];
  name?: string;
  className?: string;
};

type AdditionalProps = Record<string, unknown>;

function processChildren(
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

const Footer = ({
  children,
  className,
  horizontalAligment = 'end',
}: FooterProps) => (
  <div
    className={clsx(
      className,
      !className && 'flex flex-row gap-2 text-sm w-full',
      `justify-${horizontalAligment}`,
    )}
  >
    {children}
  </div>
);

const Error = ({className, errormessage}: ErrorProps) => {
  if (!errormessage) return <></>;

  return (
    <div className={clsx(className, 'px-4')}>
      <ErrorTextForm message={errormessage} />
    </div>
  );
};

const Item = ({
  children,
  className,
  name,
  errorMessage: errormessage,
  ...rest
}: ItemProps) => (
  <div
    className={clsx(
      className,
      !className && 'flex flex-col items-start gap-2 text-sm w-full',
    )}
  >
    {children ? (
      processChildren(children, {
        name,
        errormessage,
        hasError: !!errormessage,
        ...rest,
      })
    ) : (
      <></>
    )}
  </div>
);

Item.displayName = 'Item';

const Label = ({
  required,
  colon = true,
  label,
  name,
  htmlFor,
  children,
  className,
}: LabelProps) => (
  <label
    className={clsx(className, !className && 'flex items-start gap-1')}
    htmlFor={htmlFor ?? name}
  >
    {required ? (
      <Typography.Text className={'text-red-400'}>{'*'}</Typography.Text>
    ) : (
      <></>
    )}
    <span>
      {label || children}
      {colon ? <Typography.Text>{':'}</Typography.Text> : <></>}
    </span>
  </label>
);

type SelectOption = {label: string; value: string};

type SelectProps<TFieldValues extends FieldValues> = {
  name?: Path<TFieldValues>;
  id?: string;
  className?: string;
  placeholder?: string;
  options?: readonly SelectOption[];
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  /** Injected by FormController from react-hook-form's error state. */
  errormessage?: string;
  /**
   * Injected but always false — Form.Item destructures `errorMessage` while
   * FormController writes `errormessage`. Accepted here only so it doesn't
   * reach the DOM, where React would warn about an unknown camelCase prop.
   */
  hasError?: boolean;
  /** Injected, and unusable: `value` below is controlled. */
  defaultValue?: unknown;
};

/**
 * Adapts FormController's injected props onto Base UI's compound Select.
 *
 * Keeps antd's `options` prop so call sites didn't have to change: Base UI's
 * `items` takes the same `{label, value}` shape, and supplying it is what makes
 * `<SelectValue>` render an option's label rather than its raw value.
 */
const Select = <TFieldValues extends FieldValues>({
  name,
  id,
  className,
  placeholder,
  options = [],
  disabled,
  value,
  onChange,
  onBlur,
  errormessage,
  hasError: _hasError,
  defaultValue: _defaultValue,
}: SelectProps<TFieldValues>) => (
  <SelectRoot
    items={options}
    name={name}
    id={id}
    disabled={disabled}
    // react-hook-form seeds these fields with ''. Base UI needs null to show
    // the placeholder, since '' is a value that matches no item.
    value={value ? value : null}
    // Base UI calls this with (value, eventDetails); rhf's onChange reads the
    // first argument, so keep it to one.
    onValueChange={(next) => onChange?.(next as string)}
  >
    <SelectTrigger
      // SelectRoot renders no DOM element, so blur has to be bound here for
      // react-hook-form to mark the field touched.
      onBlur={onBlur}
      aria-invalid={!!errormessage}
      // The placeholder is replaced as soon as a value is picked, so the
      // trigger needs an accessible name that outlives it.
      aria-label={placeholder}
      className={clsx('w-full', className)}
    >
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </SelectRoot>
);

Select.displayName = 'Select';

const Form = <TFieldValues extends FieldValues>({
  children,
  methods,
  loggingMode,
  className,
  onSubmit,
  as: Component = 'form',
}: FormProps<TFieldValues>) => (
  <Component
    className={clsx(className, !className && 'flex flex-col w-full gap-3')}
    onSubmit={onSubmit}
  >
    <FormController methods={methods}>
      {children}
    </FormController>
    {Boolean(onSubmit) && <input type={'submit'} hidden />}
  </Component>
);

const Column = ({children, className, ...rest}: DivProps) => (
  <div {...rest} className={clsx('flex flex-col', className)}>
    {children ? processChildren(children, {...rest}) : <></>}
  </div>
);

Column.displayName = 'Column';

const Row = ({children, name, className, ...rest}: DivProps) => (
  <div {...rest} className={clsx('flex flex-row', className)}>
    {children ? processChildren(children, {name, ...rest}) : <></>}
  </div>
);

Row.displayName = 'Row';

Form.Item = Item;

Form.Label = Label;

Form.Input = Input;

Form.TextArea = Textarea;

Form.Select = Select;

Form.Footer = Footer;

Form.Error = Error;

Form.Column = Column;

Form.Row = Row;

export {Form};
export type {FormProps};
