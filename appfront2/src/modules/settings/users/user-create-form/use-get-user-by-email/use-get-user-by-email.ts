import { useState } from 'react';
import type { ApiError } from '~/interfaces/api-error';
import { Me } from '~/interfaces/me';
import { PaginatedModel } from '~/interfaces/paginated-model';
import { getUserByEmail as fetchUserByEmail } from '~/services/user/get-user-by-email';
import { notifyError } from '~/utils/notify-error';

export const useGetUserByEmail = () => {
  const [data, setData] = useState<PaginatedModel<Me>>();
  const [isFetchingUserByEmail, setIsFetchingUserByEmail] = useState(false);
  const [error, setError] = useState<ApiError>();

  const getUserByEmail = async (email: string) => {
    try {
      setIsFetchingUserByEmail(true);
      const user = await fetchUserByEmail(email);
      setData(user);
      setIsFetchingUserByEmail(false);
      return user;
    } catch (err) {
      setError(err as ApiError);
      setIsFetchingUserByEmail(false);
      notifyError(err);
      return undefined;
    }
  };

  return { data, error, isFetchingUserByEmail, getUserByEmail };
};
