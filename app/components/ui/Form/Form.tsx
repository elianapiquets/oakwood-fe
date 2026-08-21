import type {FieldValues, UseFormReturn, Path} from 'react-hook-form';
import {FormProvider, useFormContext} from 'react-hook-form';

import type {ReactNode} from 'react';
import React from 'react';

import {clsx} from 'clsx';

import {FormController} from './controller/FormController';
import {ErrorTextForm} from './ErrorTextForm';
import {Typography} from '../Typography';
import {Input as InputBase} from '../Input';
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../Select';
import {Textarea as TextareaBase} from '../Textarea';
import {Checkbox as CheckboxBase} from '../Checkbox';
import {
  RadioGroup as RadioGroupBase,
  RadioGroupItem as RadioGroupItemBase,
} from '../RadioGroup';


type ErrorProps = {
  className?: string;
  errormessage?: string;
};

type ItemProps<TFieldValues extends FieldValues> = {
  children?: ReactNode;
  className?: string;
  name: Path<TFieldValues>;
  /**
   * Optional: inherited from the enclosing `<Form methods={…}>`. Pass it here
   * only to bind a field to a different form than the one it sits inside.
   */
  methods?: UseFormReturn<TFieldValues>;
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
  children?: ReactNode;
  className?: string;
  /**
   * Supplied once here and shared with every `Form.Item` inside, through rhf's
   * `FormProvider`. Optional, for a `<Form>` that holds no fields.
   */
  methods?: UseFormReturn<TFieldValues>;
  onSubmit?: (event?: React.FormEvent<HTMLFormElement>) => void;
  as?: React.ElementType;
};

type DivProps = {
  children?: ReactNode;
  name?: string;
  className?: string;
};

/** Named `FieldError`, not `Error`: the latter shadows the global constructor
 *  for this whole module, so `new Error(...)` would resolve to a component. */
const FieldError = ({className, errormessage}: ErrorProps) => {
  if (!errormessage) return <></>;

  return (
    <div className={clsx(className, 'px-4')}>
      <ErrorTextForm message={errormessage} />
    </div>
  );
};

/**
 * One field. Takes the `name` and hands it, with the form methods, to
 * `FormController` — which opens a single rhf `Controller` and injects the field
 * state into whichever children want it: control, label, error message.
 *
 * The methods come from the enclosing `<Form>` via rhf's own `FormProvider`, so
 * they don't have to be repeated on every field.
 */
const Item = <TFieldValues extends FieldValues>({
  children,
  className,
  name,
  methods,
}: ItemProps<TFieldValues>) => {
  // Called unconditionally — hooks can't be. Returns null outside a provider,
  // which is why an explicit `methods` prop still wins.
  const inherited = useFormContext<TFieldValues>();
  const form = methods ?? inherited;

  if (!form) {
    throw new Error(
      'Form.Item has no form methods: pass `methods` to the enclosing <Form>, or to this Item directly.',
    );
  }

  return (
    <div
      className={clsx(
        className,
        !className && 'flex flex-col items-start gap-2 text-sm w-full',
      )}
    >
      <FormController methods={form} name={name}>
        {children}
      </FormController>
    </div>
  );
};

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

type InjectedFieldProps = {
  /** Injected by FormController; must not reach the DOM as an attribute. */
  errormessage?: string;
  /** Injected by FormController; camelCase, so React would warn about it. */
  hasError?: boolean;
};

/**
 * shadcn's `Input` spreads every prop onto a real `<input>`, so the props
 * FormController injects have to be taken off here: `errormessage` would render
 * as a literal attribute and `hasError` would trigger an unknown-prop warning.
 * `hasError` becomes `aria-invalid`, which the shadcn styles already key off.
 *
 * `value ?? ''` because rhf yields `undefined` before a field is touched, and an
 * input that starts uncontrolled and turns controlled warns on first keystroke.
 */
const Input = ({
  errormessage,
  hasError,
  value,
  ...props
}: React.ComponentProps<'input'> & InjectedFieldProps) => (
  <InputBase
    {...props}
    value={value ?? ''}
    aria-invalid={Boolean(hasError) || Boolean(errormessage)}
  />
);

/** Same treatment as `Input` — shadcn's Textarea is just as transparent. */
const TextArea = ({
  errormessage,
  hasError,
  value,
  ...props
}: React.ComponentProps<'textarea'> & InjectedFieldProps) => (
  <TextareaBase
    {...props}
    value={value ?? ''}
    aria-invalid={Boolean(hasError) || Boolean(errormessage)}
  />
);

type CheckboxFieldProps = {
  name?: string;
  id?: string;
  className?: string;
  /** Group heading above the control, matching the admin's section layout. */
  heading?: string;
  /** The checkbox's own text — and its accessible name. */
  label: string;
  value?: boolean;
  onChange?: (checked: boolean) => void;
  onBlur?: () => void;
  disabled?: boolean;
} & InjectedFieldProps;

/**
 * Boolean field. Maps FormController's injected `value`/`onChange` onto Base
 * UI's `checked`/`onCheckedChange`.
 *
 * Renders its own `<label htmlFor>` rather than leaving that to the call site:
 * Base UI's Checkbox is a `<button role="checkbox">`, not a native input, so a
 * label that merely *wraps* it isn't recognised as associated — by assistive
 * tech or by `jsx-a11y/label-has-associated-control`. Keeping the id/htmlFor
 * pair inside the component means every call site gets it right.
 */
const Checkbox = ({
  name,
  id,
  className,
  heading,
  label,
  value,
  onChange,
  onBlur,
  disabled,
  errormessage,
  hasError,
}: CheckboxFieldProps) => {
  const controlId = id ?? name ?? label;

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {heading ? (
        <span className={'text-sm font-medium text-slate-900'}>{heading}</span>
      ) : null}
      <label
        htmlFor={controlId}
        className={'flex items-center gap-2 text-sm text-slate-700'}
      >
        <CheckboxBase
          id={controlId}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange?.(checked)}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={Boolean(hasError) || Boolean(errormessage)}
        />
        {label}
      </label>
    </div>
  );
};

type RadioOption = {
  value: string;
  label: string;
  hint?: string | null;
};

type RadioGroupFieldProps = {
  name?: string;
  className?: string;
  /** Group heading. Also the group's accessible name. */
  label?: string;
  options: readonly RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
} & InjectedFieldProps;

/**
 * Enum field. Takes an `options` array like `Select` does, so a call site never
 * has to compose the primitives itself.
 *
 * The heading is a plain `<span>`, not a `Form.Label`: a radio group is not a
 * labelable control, so a `<label for>` pointing at it would dangle. The group
 * gets `aria-label` instead, and each option owns its id/htmlFor pair for the
 * same reason the checkbox does.
 */
const RadioGroup = ({
  name,
  className,
  label,
  options,
  value,
  onChange,
  onBlur,
  disabled,
  errormessage,
  hasError,
}: RadioGroupFieldProps) => (
  <div className={clsx('flex flex-col gap-2', className)}>
    {label ? (
      <span className={'text-sm font-medium text-slate-900'}>{label}</span>
    ) : null}
    <RadioGroupBase
      value={value ?? ''}
      onValueChange={(next) => onChange?.(String(next))}
      disabled={disabled}
      aria-label={label}
      aria-invalid={Boolean(hasError) || Boolean(errormessage)}
    >
      {options.map((option) => {
        const optionId = `${name ?? 'radio'}-${option.value}`;

        return (
          <label
            key={option.value}
            htmlFor={optionId}
            className={'flex items-start gap-2 text-sm text-slate-700'}
          >
            <RadioGroupItemBase
              id={optionId}
              value={option.value}
              onBlur={onBlur}
              className={'mt-0.5'}
            />
            <span>
              {option.label}
              {option.hint ? (
                <span className={'block text-xs text-slate-500'}>
                  {option.hint}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </RadioGroupBase>
  </div>
);

const Form = <TFieldValues extends FieldValues>({
  children,
  className,
  methods,
  onSubmit,
  as: Component = 'form',
}: FormProps<TFieldValues>) => {
  const element = (
    <Component
      className={clsx(className, !className && 'flex flex-col w-full gap-3')}
      onSubmit={onSubmit}
    >
      {children}
      {Boolean(onSubmit) && <input type={'submit'} hidden />}
    </Component>
  );

  // rhf's own provider rather than a bespoke context: `useFormContext` then
  // works for anything nested, not just `Form.Item`.
  return methods ? (
    <FormProvider {...methods}>{element}</FormProvider>
  ) : (
    element
  );
};

Form.Item = Item;

Form.Label = Label;

Form.Input = Input;

Form.TextArea = TextArea;

Form.Select = Select;

Form.Checkbox = Checkbox;

Form.RadioGroup = RadioGroup;


Form.Error = FieldError;


export {Form};
export type {FormProps};
