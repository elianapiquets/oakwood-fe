

import type { InputBaseProps } from '../InputWrapper';
import type { FieldValues } from 'react-hook-form';

import React, { useState } from 'react';

import { Input as InputAntd } from 'antd';
import clsx from 'clsx';

import {
  TEXTAREA_BASE_CLASSNAMES,
  TEXTAREA_ERROR_CLASSNAMES,
  TEXTAREA_FOCUSED_CLASSNAMES,
} from '../InputWrapper';

type TextAreaProps<TFieldValues extends FieldValues> =
  React.ComponentPropsWithoutRef<typeof InputAntd.TextArea> &
    InputBaseProps<TFieldValues>;

const TextArea = <TFieldValues extends FieldValues>(
  props: TextAreaProps<TFieldValues>,
) => {
  const {
    onChange,
    name,
    className,
    placeholder,
    id,
    disabled,
    defaultValue,
    value,
    hasError,
    errormessage,
    maxLength,
    rows,
    showCount,
    autoSize = { minRows: 6, maxRows: 8 },
    onFocus,
    onBlur,
  } = props;

  const [isFocused, setIsFocused] = useState(false);

  const error = hasError || errormessage;

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);

    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);

    onBlur?.(e);
  };

  return (
    <InputAntd.TextArea
      autoSize={autoSize}
      rows={rows}
      showCount={showCount}
      maxLength={maxLength}
      placeholder={placeholder}
      id={id}
      onChange={onChange}
      name={name}
      defaultValue={defaultValue}
      value={value}
      disabled={disabled}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={clsx(
        TEXTAREA_BASE_CLASSNAMES,
        {
          [TEXTAREA_FOCUSED_CLASSNAMES]: isFocused && !error,
          [TEXTAREA_ERROR_CLASSNAMES]: error,
        },
        className,
      )}
    />
  );
};

export { TextArea };
export type { TextAreaProps };
