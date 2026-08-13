import type {UseFormProps} from 'react-hook-form';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BASE_FORM_CONFIG: Partial<UseFormProps<any>> = {
  mode: 'onChange',
  delayError: 1500,
};
