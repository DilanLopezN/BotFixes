import { typeDownloadEnum } from '../../../../common/utils/downloadFileType';
import { AgentStatusAnalyticsFilterDto } from '../dto/agent-status-analytics-filter.dto';

export interface AgentStatusAnalyticsCSVParams extends AgentStatusAnalyticsFilterDto {
    downloadType?: typeDownloadEnum;
    timezone?: string;
}
