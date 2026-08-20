import type {FieldValues, UseFormReturn, Path} from 'react-hook-form';

import type {ReactElement, ReactNode} from 'react';
import React, {Children, createElement, isValidElement, Fragment} from 'react';

import {clsx} from 'clsx';

import {FormController} from './controller';
import {ErrorTextForm} from '../ErrorTextForm';
import {Typography} from '../Typography';
import {Input} from '../Input';
import {MaskedInput} from '../MaskedInput';
import {Select} from '../Select';
import {TextArea} from '../TextArea';

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

type FormButtonProps = React.ComponentProps<typeof Button> & {
  hasError?: boolean;
  errormessage?: string;
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
    <FormController methods={methods} loggingMode={loggingMode}>
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

Form.TextArea = TextArea;

Form.MaskedInput = MaskedInput;

Form.Select = Select;

Form.Footer = Footer;

Form.Error = Error;

Form.Column = Column;

Form.Row = Row;

export {Form};
export type {FormProps};
