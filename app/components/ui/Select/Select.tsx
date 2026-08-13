

import type { SelectProps as AntdSelectProps } from 'antd';
import type { FieldValues, Path } from 'react-hook-form';

import React, { useState } from 'react';

import { Select as SelectAntd } from 'antd';
import { clsx } from 'clsx';

import {
  INPUT_ERROR_CLASSNAMES,
  INPUT_FOCUSED_CLASSNAMES,
  INPUT_DISABLED_CLASSNAMES,
  InputWrapper,
} from '../InputWrapper';
import { ChevronDown } from 'lucide-react';

type SelectProps<TFieldValues extends FieldValues> = AntdSelectProps & {
  id?: string;
  placeholder?: string;
  name?: Path<TFieldValues>;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  suffix?: React.ReactNode;
  className?: string;
  errormessage?: string;
};

const Select = <TFieldValues extends FieldValues>(
  props: SelectProps<TFieldValues>,
) => {
  const {
    name,
    id,
    placeholder,
    options,
    onChange,
    defaultValue,
    value,
    disabled,
    suffix,
    errormessage: error,
    onFocus,
    onBlur,
    hasError: _hasError,
    className: _className,
    ...restAntdProps
  } = props as SelectProps<TFieldValues> & { hasError?: boolean };

  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const isFloating = isFocused || !!value;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);

    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);

    onBlur?.(e);
  };

  if (!name || !onChange) {
    console.log('name and onChange are required');

    return null;
  }

  const { dropdownRender, ...remainingAntdProps } = restAntdProps;

  const defaultDropdownRender: typeof dropdownRender = (menu) => (
    <>
      <div
        className={'px-3 pt-1 pb-2 text-BodyRegularMd text-label select-none'}
      >
        {'select an option'}
      </div>
      {menu}
    </>
  );

  return (
    <InputWrapper placeholder={placeholder} isFloating={isFloating}>
      <SelectAntd
        {...remainingAntdProps}
        options={options}
        disabled={disabled}
        getPopupContainer={(trigger) => trigger.parentElement}
        value={value}
        onClick={() => {
          document.body.style.pointerEvents = 'auto';
        }}
        id={id}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onChange={onChange}
        onDropdownVisibleChange={setIsOpen}
        dropdownRender={dropdownRender ?? defaultDropdownRender}
        className={clsx(
          '!text-primary !bg-secondary-10 !text-BodyRegularLg !px-4 !pt-6 !pb-2 !border-[0.75px] !h-[unset] !w-full',
          '!border-secondary-10 hover:!border-primary !rounded-xl !disabled:bg-subtle focus:!border-primary focus-within:!border-primary',
          '[&_.ant-input-suffix]:!absolute [&_.ant-input-suffix]:!right-4 [&_.ant-input-suffix]:!top-1/2 [&_.ant-input-suffix]:!-translate-y-1/2',
          '[&_.ant-select-selection-item]:!text-BodyRegularLg',
          '[&_.ant-select-dropdown]:!p-2',
          '[&_.ant-select-item-option-disabled]:!bg-secondary-5',
          '[&_.ant-select-item-option-selected]:!bg-accent-matcha-100',
          '[&_.ant-select-item]:!px-3sm [&_.ant-select-item]:!py-sm [&_.ant-select-item]:!rounded-md',
          '[&_.rc-virtual-list-holder-inner]:!gap-1 [&_.rc-virtual-list-holder]:!max-h-90',
          {
            [INPUT_FOCUSED_CLASSNAMES]: isFocused && !error,
            [INPUT_ERROR_CLASSNAMES]: error,
            [INPUT_DISABLED_CLASSNAMES]: disabled,
          },
        )}
        defaultValue={defaultValue}
        suffixIcon={
          suffix ?? (
            <ChevronDown
              size={20}
              className={clsx('transition-transform duration-200 mt-0.5', {
                'text-primary': !disabled,
                'text-inactive': disabled,
                'rotate-180': isOpen,
              })}
            />
          )
        }
      />
    </InputWrapper>
  );
};

Select.displayName = 'Select';

export { Select };
export type { SelectProps };
