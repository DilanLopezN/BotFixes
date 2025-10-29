import { Input, type InputRef } from 'antd';
import React, { forwardRef, useEffect, useState } from 'react';
import type { NumberInputProps } from './interfaces';

export const NumberInput = forwardRef<InputRef, NumberInputProps>(
  ({ value, onChange, allowFloatValue, allowNegativeValue, onBlur, showArrows, ...props }, ref) => {
    const [inputValue, setInputValue] = useState('');

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
      let formattedValue;

      formattedValue = event.target.value
        // Remove caracteres que não sejam números, "," ou "-"
        .replace(/[^\d,-]/g, '')

        // Remove a vírgula, caso ele seja o primeiro caractere
        .replace(/^,/, '')

        // Remove a vírgula, caso ele já tenha sido usado antes
        .replace(/(\d)(,)(\d*),/, '$1$2$3')

        // Remove o sinal de menos, caso ele não for o primeiro caractere
        .replace(/(\d)-/, '$1')

        // Remove o sinal de menos, caso ele já tenha sido usado antes
        .replace(/(-)(\d*)-/, '$1$2')

        // Remove repetições de 0, caso seja a primeira casa decimal
        .replace(/(^0)0*/, '$1')

        // Remove os 0 a esquerda do numero
        .replace(/^0(\d)/, '$1');

      // Remove a parte fracionada, caso a prop allowFloatValue não for true
      if (!allowFloatValue) {
        const [integerPart] = formattedValue.split(',');
        formattedValue = integerPart;
      }

      // Remove o simbolo de menos, caso a prop allowNegativeValue não for true
      if (!allowNegativeValue) {
        formattedValue = formattedValue.replace(/^-/, '');
      }

      setInputValue(formattedValue);

      if (onChange) {
        const newValue =
          formattedValue !== '' ? Number(formattedValue.replace(',', '.')) : undefined;
        onChange(newValue);
      }
    };

    const handleBlur: React.FocusEventHandler<HTMLInputElement> = (event) => {
      if (onBlur) {
        onBlur(event);
      }
      if (onChange) {
        // Remove a ',' do último caractere, caso não seja digitado nenhum valor depois dele
        const formattedInput = inputValue.replace(/,$/g, '');
        setInputValue(formattedInput);
      }
    };

    useEffect(() => {
      const inputValueAsNumber =
        inputValue !== '' ? Number(inputValue.replace(',', '.')) : undefined;

      if (value === inputValueAsNumber) {
        return;
      }

      if (value || value === 0) {
        const formattedInputValue = String(value).replace('.', ',');
        setInputValue(String(formattedInputValue));
      }
    }, [inputValue, value]);

    return (
      <Input
        ref={ref}
        {...props}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        type={showArrows ? 'number' : undefined}
      />
    );
  }
);
