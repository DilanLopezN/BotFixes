import { IButton } from "kissbot-core";

export interface HeaderProps {
  viewSelected: string;
  onViewChanged: Function;
  children?: React.ReactNode;
  values?: IButton
}
