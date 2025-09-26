import type { InputProps } from 'antd';

export type NumberInputProps = Omit<InputProps, 'onChange'> & {
  onChange?: (value: number | undefined) => void;
  allowFloatValue?: boolean;
  allowNegativeValue?: boolean;
  showArrows?: boolean;
};
