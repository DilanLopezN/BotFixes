import { notification } from 'antd';
import type { ApiError } from '~/interfaces/api-error';

export const notifyError = (error: unknown, shouldOverlap?: boolean) => {
  let errorDescription = '';

  if (typeof error === 'string') {
    errorDescription = error;
  } else {
    const typedError = error as ApiError;
    errorDescription = typedError.response?.data.message || '';
  }

  notification.error({
    key: shouldOverlap ? 'notify-error-key' : undefined,
    message: 'Erro',
    description: errorDescription,
    placement: 'bottomRight',
  });
};
