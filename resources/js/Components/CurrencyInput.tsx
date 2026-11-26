import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number | string | null | undefined;
    onChange: (value: number) => void;
    placeholder?: string;
    className?: string;
}

export const formatNumberWithDots = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined || val === '') return '';
    const num = typeof val === 'number' ? val : Number(String(val).replace(/[^0-9]/g, ''));
    if (isNaN(num) || num === 0) return '';
    return num.toLocaleString('id-ID');
};

export default function CurrencyInput({
    value,
    onChange,
    placeholder = 'Rp 0',
    className = '',
    disabled = false,
    ...rest
}: CurrencyInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const cursorOffsetRef = useRef<number | null>(null);

    // Numeric value
    const numericValue = typeof value === 'number' ? value : (Number(String(value || '').replace(/[^0-9]/g, '')) || 0);
    // Display value with Rp prefix and dot separators, or empty if 0/empty
    const displayValue = numericValue > 0 ? `Rp ${numericValue.toLocaleString('id-ID')}` : '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const rawVal = input.value;
        const currentCursor = input.selectionStart || 0;

        // Count how many digits are before the cursor in the current input value
        const digitsBeforeCursor = rawVal.slice(0, currentCursor).replace(/[^0-9]/g, '').length;

        // Extract clean numbers
        const digitsOnly = rawVal.replace(/[^0-9]/g, '');
        const newNumber = digitsOnly ? parseInt(digitsOnly, 10) : 0;

        // Remember target digit count before cursor for position restoration
        cursorOffsetRef.current = digitsBeforeCursor;

        onChange(newNumber);
    };

    useLayoutEffect(() => {
        if (inputRef.current && cursorOffsetRef.current !== null) {
            const input = inputRef.current;
            const targetDigitCount = cursorOffsetRef.current;
            const currentFormatted = input.value;

            // Find the character index where targetDigitCount digits have appeared
            let foundDigits = 0;
            let newCursorPos = currentFormatted.length;

            for (let i = 0; i < currentFormatted.length; i++) {
                if (/[0-9]/.test(currentFormatted[i])) {
                    foundDigits++;
                    if (foundDigits === targetDigitCount) {
                        newCursorPos = i + 1;
                        break;
                    }
                }
            }

            // If targetDigitCount is 0, position after 'Rp ' if present, else 0
            if (targetDigitCount === 0) {
                newCursorPos = currentFormatted.startsWith('Rp ') ? 3 : 0;
            }

            input.setSelectionRange(newCursorPos, newCursorPos);
            cursorOffsetRef.current = null;
        }
    }, [displayValue]);

    return (
        <input
            {...rest}
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
        />
    );
}
