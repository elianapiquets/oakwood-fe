import type { InputWrapperProps } from './types';

import {clsx} from 'clsx';

import { Lock } from 'lucide-react';

const InputWrapper = ({
  children,
  placeholder,
  isFloating,
  className,
}: InputWrapperProps) => (
  <div className={clsx('relative w-full', className)}>
    {placeholder && (
      <span
        className={clsx(
          'text-BodyRegularLg text-label absolute left-4 pointer-events-none transition-all duration-200 ease-in-out z-10 text-ellipsis line-clamp-1',
          isFloating ? 'top-2 text-xs' : 'top-1/2 -translate-y-1/2 ',
        )}
      >
        {placeholder}
      </span>
    )}
    {children}
  </div>
);

const InputLockSuffix = <Lock size={16} className={'text-primary/20'} />;

export { InputWrapper, InputLockSuffix };
