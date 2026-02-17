import * as React from 'react';

interface SpinnerProps {
  variant?: 'default' | 'light';
}

export function Spinner({ variant = 'default' }: SpinnerProps) {
  return <span className={`spinner${variant === 'light' ? ' spinner--light' : ''}`} />;
}
