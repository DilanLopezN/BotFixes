import { notification } from 'antd';
import { NotifySuccessProps } from './interfaces';

export const notifySuccess = ({ message, description }: NotifySuccessProps) => {
  notification.success({
    message,
    description,
    placement: 'bottomRight',
    key: 'sucess_notification',
  });
};
