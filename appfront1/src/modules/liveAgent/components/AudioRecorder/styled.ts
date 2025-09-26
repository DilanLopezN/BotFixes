import styled from 'styled-components'
import { AiFillAudio, AiFillCloseCircle, AiFillCheckCircle } from 'react-icons/ai';

const defaultIconStyle = `
  height: 20px;
  width: 20px;
  color: #666;
  margin: 0 5px;
  cursor: pointer;
`;

export const MicIcon = styled(AiFillAudio)`${defaultIconStyle}`;

export const CancelIcon = styled(AiFillCloseCircle)`${defaultIconStyle}`;

export const FinishIcon = styled(AiFillCheckCircle)`${defaultIconStyle}`;
