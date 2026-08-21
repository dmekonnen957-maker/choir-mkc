import { forwardRef, useId } from 'react';

const Input = forwardRef(function Input(
    { label, error, hint, id, className = '', required = false, trailing = null, ...props },
    ref,
) {
    const autoId = useId();
    const inputId = id || autoId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const base =
        'w-full rounded-lg border bg-canvas px-3.5 py-2.5 text-ink-800 placeholder:text-ink-400 transition-colors focus:outline-none focus:ring-2';
    const state = error
        ? 'border-red-400 focus:ring-red-300'
        : 'border-ink-200 focus:border-navy-400 focus:ring-navy-200';

    return (
        <div className={className}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="mb-1.5 block text-sm font-medium text-ink-700"
                >
                    {label}
                    {required && (
                        <span className="ml-0.5 text-gold-600" aria-hidden="true">
                            *
                        </span>
                    )}
                </label>
            )}
            <div className="relative">
                <input
                    ref={ref}
                    id={inputId}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? errorId : hint ? hintId : undefined}
                    className={`${base} ${state} ${trailing ? 'pr-11' : ''}`}
                    {...props}
                />
                {trailing && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {trailing}
                    </div>
                )}
            </div>
            {error ? (
                <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-600">
                    {error}
                </p>
            ) : hint ? (
                <p id={hintId} className="mt-1.5 text-sm text-ink-400">
                    {hint}
                </p>
            ) : null}
        </div>
    );
});

export default Input;
