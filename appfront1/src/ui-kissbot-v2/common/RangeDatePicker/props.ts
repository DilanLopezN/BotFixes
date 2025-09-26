export default interface RangeDatePickerProps {
  size?: "small" | "large" | undefined;
  name: string;
  disabled?: boolean | undefined;
  defaultValue?: any | undefined;
  format?: string | undefined;
  onChange?: Function | any | undefined;
  placeholder?: [string, string];
}
