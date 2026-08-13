import type { InputBaseProps } from '../InputWrapper';
import type { InputProps as AntdInputProps } from 'antd';
import type { MaskedInput as MaskedInputAntd } from 'antd-mask-input';
import type { FieldValues } from 'react-hook-form';

import type { ComponentProps } from 'react';

type NativeChangeEvent = Parameters<
  NonNullable<ComponentProps<typeof MaskedInputAntd>['onChange']>
>[0];

type Options = {
  returnMasked?: boolean;
  returnAsNumber?: boolean;
};

type ChangeEvent = Omit<NativeChangeEvent, 'target' | 'currentTarget'> & {
  target: Omit<NativeChangeEvent['target'], 'value'> & {
    value: string | number;
  };
  currentTarget: Omit<NativeChangeEvent['currentTarget'], 'value'> & {
    value: string | number;
  };
};

type MaskedInputProps<TFieldValues extends FieldValues> = Omit<
  AntdInputProps,
  'pattern'
> &
  InputBaseProps<TFieldValues> & {
    pattern: ComponentProps<typeof MaskedInputAntd>['mask'];
    maskOptions?: ComponentProps<typeof MaskedInputAntd>['maskOptions'];
    onChange?: (e: ChangeEvent) => void;
  } & Options;

export type { MaskedInputProps, NativeChangeEvent, ChangeEvent, Options };
