import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Input from './Input';

const PasswordInput = forwardRef(function PasswordInput(
    { label, error, hint, id, className = '', required = false, glass = false, ...props },
    ref,
) {
    const [visible, setVisible] = useState(false);

    return (
        <Input
            ref={ref}
            id={id}
            label={label}
            error={error}
            hint={hint}
            required={required}
            type={visible ? 'text' : 'password'}
            className={className}
            glass={glass}
            trailing={
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    className={`flex items-center transition-colors ${glass ? 'text-white/70 hover:text-white' : 'text-ink-400 hover:text-ink-600'}`}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    aria-pressed={visible}
                    tabIndex={-1}
                >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            }
            {...props}
        />
    );
});

export default PasswordInput;
