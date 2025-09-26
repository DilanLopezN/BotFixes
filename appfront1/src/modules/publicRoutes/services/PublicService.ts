import { doRequest, apiInstanceWithoutToken } from '../../../utils/Http';

export const PublicService = {
    getResumeTeamRealTime: async (workspaceId: string): Promise<any> => {
        return await doRequest(
            apiInstanceWithoutToken.get(`public/${workspaceId}/resume-real-time`),
            true
        );
    },
};
