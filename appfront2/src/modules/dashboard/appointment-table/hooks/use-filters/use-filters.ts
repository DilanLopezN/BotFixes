import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ConversationStatus } from '~/constants/conversation-status';
import { useQueryString } from '~/hooks/use-query-string';
import type { AppointmentTableQueryString } from '../../interfaces';

export const useFilters = () => {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { queryStringAsObj } = useQueryString<AppointmentTableQueryString>();

  const { startDate, endDate, channelId, includeAppointmentDetails } = queryStringAsObj;

  const agentIds = useMemo(() => {
    return queryStringAsObj.agentIds?.split(',');
  }, [queryStringAsObj.agentIds]);

  const tags = useMemo(() => {
    return queryStringAsObj.tags?.split(',');
  }, [queryStringAsObj.tags]);

  const teamIds = useMemo(() => {
    return queryStringAsObj.teamIds?.split(',');
  }, [queryStringAsObj.teamIds]);

  const appointmentStatus = useMemo(() => {
    return queryStringAsObj.appointmentStatus?.split(',');
  }, [queryStringAsObj.appointmentStatus]) as ConversationStatus[];

  const filters = useMemo(() => {
    const baseFilters = {
      workspaceId,
      startDate,
      endDate,
      agentIds: agentIds || undefined,
      state: appointmentStatus || undefined,
      tags: tags || undefined,
      teamIds: teamIds || undefined,
      channelId: channelId || undefined,
      includeAppointmentDetails: includeAppointmentDetails
        ? includeAppointmentDetails === 'true'
        : false,
    };
    return baseFilters;
  }, [
    agentIds,
    appointmentStatus,
    channelId,
    endDate,
    includeAppointmentDetails,
    startDate,
    tags,
    teamIds,
    workspaceId,
  ]);

  return filters;
};
