import { AiExecuteData } from '.';
import { File } from '../../../common/interfaces/uploaded-file';

export interface AIProvider {
  executeFile(prompt: string, file: File, fileUrl: string): Promise<AiExecuteData>;
  execute(prompt: string): Promise<AiExecuteData>;
}
