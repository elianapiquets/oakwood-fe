import type { NativeChangeEvent, Options, ChangeEvent } from './types';

const transformToUnmaskedValue = (
  e: NativeChangeEvent,
  options?: Options,
): ChangeEvent => {
  if (options?.returnMasked) {
    return e;
  }

  const event: ChangeEvent = {
    ...e,
    target: {
      ...e.target,
      value: options?.returnAsNumber
        ? Number(e.unmaskedValue)
        : e.unmaskedValue,
    },
    currentTarget: {
      ...e.currentTarget,
      value: options?.returnAsNumber
        ? Number(e.unmaskedValue)
        : e.unmaskedValue,
    },
  };

  return event;
};

export { transformToUnmaskedValue };
