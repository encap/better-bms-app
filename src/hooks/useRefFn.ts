import React, { useRef } from 'react';

const NO_VALUE = {};

export function useRefFn<T>(init: () => T) {
  const ref = useRef<T | typeof NO_VALUE>(NO_VALUE);
  if (ref.current === NO_VALUE) {
    ref.current = init();
  }
  return ref as React.MutableRefObject<T>;
}
