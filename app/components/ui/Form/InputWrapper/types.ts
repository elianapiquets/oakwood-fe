import type { FieldValues, Path } from 'react-hook-form';

import type { ReactNode } from 'react';
import type React from 'react';

type InputWrapperProps = {
  children: React.ReactNode;
  placeholder?: string;
  isFloating?: boolean;
  className?: string;
};

type InputBaseProps<TFieldValues extends FieldValues> = {
  id?: string;
  placeholder?: string;
  className?: string;
  addonBefore?: ReactNode;
  maxLength?: number;
  name?: Path<TFieldValues>;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  disabled?: boolean;
  value?: string;
  hasError?: boolean;
  errormessage?: string;
  classNames?: {
    root?: string;
    input?: string;
  };
};

export type { InputBaseProps, InputWrapperProps };
