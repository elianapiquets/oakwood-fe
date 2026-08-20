import type {UseFormProps} from 'react-hook-form';

export const BASE_FORM_CONFIG: Partial<UseFormProps<any>> = {
  mode: 'onChange',
  delayError: 1500,
};
