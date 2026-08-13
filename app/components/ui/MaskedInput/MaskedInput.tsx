'use client';

import type { MaskedInputProps } from './types';
import type { FieldValues } from 'react-hook-form';

import React, { useState } from 'react';

import { MaskedInput as MaskedInputAntd } from 'antd-mask-input';
import clsx from 'clsx';

import { transformToUnmaskedValue } from './utils';
import {
  INPUT_BASE_CLASSNAMES,
  INPUT_ANTD_SUFFIX_CLASSNAMES,
  INPUT_FLOATING_CLASSNAMES,
  INPUT_FOCUSED_CLASSNAMES,
  INPUT_DISABLED_CLASSNAMES,
  INPUT_ERROR_CLASSNAMES,
  InputWrapper,
  InputLockSuffix,
} from '../InputWrapper';

// TODO: review ts performance of extracting props from MaskedInputAntd component and not using MaskedInputProps from antd-mask-input import { MaskType } from 'antd-mask-input/build/main/lib/MaskedInput';
const MaskedInput = <TFieldValues extends FieldValues>(
  props: MaskedInputProps<TFieldValues>,
) => {
  const {
    onChange,
    name,
    className,
    placeholder,
    id,
    disabled,
    pattern,
    type,
    addonBefore,
    maxLength,
    onBlur,
    onFocus,
    defaultValue,
    value,
    hasError,
    errormessage,
    returnMasked,
    returnAsNumber,
    classNames,
    suffix,
    maskOptions,
  } = props;

  const [isFocused, setIsFocused] = useState(false);

  if (!name || !onChange) {
    console.log('name and onChange are required');

    return null;
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);

    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);

    onBlur?.(e);
  };

  const error = hasError || errormessage;

  const isEmpty = typeof value === 'number' ? false : !value;

  const isFloating = isFocused || !isEmpty;

  return (
    <InputWrapper
      placeholder={placeholder}
      isFloating={isFloating}
      className={className ?? classNames?.root}
    >
      <MaskedInputAntd
        id={id}
        placeholder={''}
        name={name}
        value={isEmpty ? '' : String(value)}
        onChange={(event) => {
          onChange(
            transformToUnmaskedValue(event, { returnMasked, returnAsNumber }),
          );
        }}
        defaultValue={
          defaultValue || typeof defaultValue === 'number'
            ? String(defaultValue)
            : ''
        }
        className={clsx(
          INPUT_BASE_CLASSNAMES,
          { [INPUT_ANTD_SUFFIX_CLASSNAMES]: !!suffix || disabled },
          {
            [INPUT_FLOATING_CLASSNAMES]: isFloating,
            [INPUT_FOCUSED_CLASSNAMES]: isFocused && !error,
            [INPUT_ERROR_CLASSNAMES]: error,
            [INPUT_DISABLED_CLASSNAMES]: disabled,
            '!text-primary/0 [&>*]:!text-primary/0': isEmpty && !isFocused,
          },
        )}
        classNames={classNames}
        addonBefore={addonBefore}
        type={type}
        maxLength={maxLength}
        onBlur={handleBlur}
        disabled={disabled}
        onFocus={handleFocus}
        mask={pattern}
        maskOptions={maskOptions}
        suffix={disabled ? InputLockSuffix : suffix}
      />
    </InputWrapper>
  );
};

export { MaskedInput };
export type { MaskedInputProps };
