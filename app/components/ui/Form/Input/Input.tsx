import type {InputBaseProps} from '../InputWrapper';
import type {InputProps as AntdInputProps} from 'antd';
import type {FieldValues} from 'react-hook-form';

import React, {useEffect, useState} from 'react';

import {Input as InputAntd} from 'antd';
import {clsx} from 'clsx';

import {
  InputWrapper,
  InputLockSuffix,
  INPUT_BASE_CLASSNAMES,
  INPUT_ERROR_CLASSNAMES,
  INPUT_FLOATING_CLASSNAMES,
  INPUT_FOCUSED_CLASSNAMES,
  INPUT_DISABLED_CLASSNAMES,
  INPUT_ANTD_SUFFIX_CLASSNAMES,
  INPUT_ANTD_PREFIX_CLASSNAMES,
} from '../InputWrapper';
import {Eye, EyeOff} from 'lucide-react';

type InputProps<TFieldValues extends FieldValues> = AntdInputProps &
  InputBaseProps<TFieldValues>;

const Input = <TFieldValues extends FieldValues>(
  props: InputProps<TFieldValues>,
) => {
  const {
    onChange,
    name,
    className,
    checked,
    placeholder,
    id,
    disabled,
    type,
    addonBefore,
    maxLength,
    onBlur,
    onFocus,
    defaultValue,
    prefix,
    hasError,
    errormessage,
    suffix,
    value,
    readOnly,
    onKeyUp,
    onMouseOver,
    'aria-label': ariaLabel,
    classNames,
  } = props;

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(
    String(defaultValue ?? ''),
  );

  useEffect(() => {
    setInternalValue(Number.isNaN(value) ? '' : String(value ?? ''));
  }, [value]);

  const isFloating = isFocused || !!value || !!internalValue;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);

    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);

    onBlur?.(e);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setInternalValue(e.target.value);

    onChange?.(e);
  };

  if (!onChange) {
    console.warn('onChange is required');
  }

  const error = hasError || errormessage;

  if (type === 'checkbox') {
    return (
      <label
        className={clsx(
          'input-checkbox-wrapper',
          'min-w-[20px] min-h-[20px]',
          className,
          classNames?.root,
        )}
      >
        <input
          className={clsx('sr-only', classNames?.input)}
          id={id}
          name={name}
          onChange={onChange}
          type={'checkbox'}
          checked={checked}
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          onKeyUp={onKeyUp}
          onMouseOver={onMouseOver}
          // Keyboard parity with onMouseOver, matching the other branches.
          onFocus={handleFocus}
        />
        <span className={'input-checkbox-checkmark'}></span>
        {/* The checkbox's visible text lives with the consumer, so surface any
            supplied accessible name here — the label itself needs text. */}
        {ariaLabel ? <span className="sr-only">{ariaLabel}</span> : null}
      </label>
    );
  }

  if (type === 'password') {
    return (
      <InputWrapper
        placeholder={placeholder}
        isFloating={isFloating}
        className={clsx(classNames?.root, className)}
      >
        <InputAntd.Password
          id={id}
          placeholder={''}
          name={name}
          onChange={handleChange}
          defaultValue={defaultValue}
          value={value}
          addonBefore={addonBefore}
          prefix={prefix}
          maxLength={maxLength}
          onBlur={handleBlur}
          onFocus={handleFocus}
          disabled={disabled}
          className={clsx(INPUT_BASE_CLASSNAMES, INPUT_ANTD_SUFFIX_CLASSNAMES, {
            [INPUT_FLOATING_CLASSNAMES]: isFloating,
            [INPUT_FOCUSED_CLASSNAMES]: isFocused && !error,
            [INPUT_ERROR_CLASSNAMES]: error,
            [INPUT_DISABLED_CLASSNAMES]: disabled,
          })}
          classNames={classNames}
          visibilityToggle={{
            visible: passwordVisible,
            onVisibleChange: setPasswordVisible,
          }}
          iconRender={(visible) => (
            <div className={'flex items-center justify-center w-5 h-5'}>
              {visible ? (
                <Eye size={20} className={'text-primary/30'} />
              ) : (
                <EyeOff size={20} className={'text-primary/30'} />
              )}
            </div>
          )}
          suffix={suffix}
        />
      </InputWrapper>
    );
  }

  return (
    <InputWrapper
      placeholder={placeholder}
      isFloating={isFloating}
      className={clsx(classNames?.root, className)}
    >
      <InputAntd
        id={id}
        placeholder={''}
        name={name}
        onChange={handleChange}
        defaultValue={defaultValue}
        addonBefore={addonBefore}
        addonAfter={props.addonAfter}
        type={type}
        prefix={prefix}
        maxLength={maxLength}
        onBlur={handleBlur}
        value={value}
        disabled={disabled}
        onFocus={handleFocus}
        className={clsx(
          INPUT_BASE_CLASSNAMES,
          INPUT_ANTD_SUFFIX_CLASSNAMES,
          INPUT_ANTD_PREFIX_CLASSNAMES,
          {
            [INPUT_FLOATING_CLASSNAMES]: isFloating,
            [INPUT_FOCUSED_CLASSNAMES]: isFocused && !error,
            [INPUT_ERROR_CLASSNAMES]: error,
            [INPUT_DISABLED_CLASSNAMES]: disabled,
          },
        )}
        classNames={classNames}
        suffix={disabled ? InputLockSuffix : suffix}
        readOnly={readOnly}
        onKeyUp={onKeyUp}
        onMouseOver={onMouseOver}
      />
    </InputWrapper>
  );
};

export {Input};
export type {InputProps};
