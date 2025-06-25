import { IResponseButton } from './responseButton.interface';

export enum SetAttributeAction {
  set = 'set',
  remove = 'remove',
}

export interface IResponseElement {
  _id?: string;
}

export interface IResponseElementMessage extends IResponseElement {
  text?: string[];
}

export interface IResponseElementWebhook extends IResponseElement {
  webhookId?: string;
}

export interface IResponseElementButtons extends IResponseElement {
  title: string;
  buttons: IResponseButton[];
}

export interface IResponseElementCard extends IResponseElement {
  title: string;
  subtitle: string;
  imageUrl: string;
}

export interface IResponseElementSetAttribute extends IResponseElement {
  name: string;
  action: SetAttributeAction;
  value: string;
  type: string;
}

export interface IResponseElementQuestion extends IResponseElement {
  name: string;
}

export interface IResponseElementGoto extends IResponseElement {
  value: string;
}
