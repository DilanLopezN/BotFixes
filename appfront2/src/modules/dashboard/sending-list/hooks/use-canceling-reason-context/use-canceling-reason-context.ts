import { useContext } from 'react';
import { CancelingReasonContext } from '../../contexts/canceling-reasons-context';

export const useCancelingReasonContext = () => useContext(CancelingReasonContext);
