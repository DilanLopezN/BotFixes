import { AIProviderType } from '.';
import { File } from '../../../common/interfaces/uploaded-file';

interface AiExecuteData {
  message: string;
  promptTokens: number;
  completionTokens: number;
}

interface AiExecuteFile {
  prompt: string;
  file: File;
  fileUrl: string;
  provider?: AIProviderType;
}

interface AiExecute {
  prompt: string;
  provider?: AIProviderType;
}

export { AiExecute, AiExecuteFile, AiExecuteData };
