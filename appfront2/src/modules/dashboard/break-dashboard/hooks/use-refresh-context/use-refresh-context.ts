import { useContext } from 'react';
import { RefreshContext } from '../../context/refresh-context';

export const useRefreshContext = () => useContext(RefreshContext);
