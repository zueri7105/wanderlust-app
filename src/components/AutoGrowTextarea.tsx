import React, { useEffect, useRef } from 'react';

/**
 * Textarea that grows with its content — never scrollable, never manually
 * resizable; the box simply expands one row at a time as the user types.
 */
interface AutoGrowTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'> {
  minRows?: number;
}

export default function AutoGrowTextarea({ minRows = 1, className = '', value, ...rest }: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const line = parseFloat(getComputedStyle(el).lineHeight) || 18;
    const minH = line * minRows + 12;
    el.style.height = `${Math.max(el.scrollHeight, minH)}px`;
  }, [value, minRows]);

  return (
    <textarea
      ref={ref}
      rows={minRows}
      value={value}
      className={`resize-none overflow-hidden ${className}`}
      {...rest}
    />
  );
}
