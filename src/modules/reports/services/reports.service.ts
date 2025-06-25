import { Injectable } from '@nestjs/common';
import { CatchError, Exceptions } from '../../auth/exceptions';
import { FilterCampaignInfoDto } from '../dto/filter_get_campaign_info.dto';
import { ExternalDataService } from './external-data.service';
import * as moment from 'moment';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { REPORTS_CONNECTION_NAME } from '../connName';
import { Result_getUserList } from '../interfaces/result_get_user_list.interface';
import { Result_getCampaignReports } from '../interfaces/result_get_campaign_reports.interface';

@Injectable()
export class ReportsService {
    constructor(
        @InjectConnection(REPORTS_CONNECTION_NAME) private connection: Connection,
        private readonly externalDataService: ExternalDataService,
    ) {}

    @CatchError()
    async getCampaignReports(workspaceId: string, filter: FilterCampaignInfoDto): Promise<Result_getCampaignReports[]> {
        const date = moment(filter.dataDaBusca, 'DD-MM-YYYY').toDate();

        if (!moment(date).isValid()) {
            throw Exceptions.INVALID_DATE_FILTER;
        }

        const startDate = moment(date).startOf('day').valueOf();
        const endDate = moment(date).endOf('day').valueOf();

        const query = `
SELECT
    camp.id AS id_lista,
    camp.name AS nome_lista,
    to_timestamp(camp.created_at / 1000) AS data_criacao_lista,
    to_timestamp(camp.started_at / 1000) AS data_envio_lista,
    con.phone AS telefone_contato,
    to_timestamp(cc.send_at / 1000) AS data_envio_para_contato,
    CASE
        WHEN act_msg.answered_at IS NOT NULL THEN 'respondido'
        WHEN act_msg.read_at IS NOT NULL THEN 'lido'
        WHEN act_msg.received_at IS NOT NULL THEN 'recebido'
        WHEN act_msg.status_id = -1 THEN 'numero_invalido'
        ELSE 'enviado'
    END AS status_envio,
    CASE
        WHEN act_msg.answered_at IS NOT NULL THEN to_timestamp(act_msg.answered_at / 1000)
        WHEN act_msg.read_at IS NOT NULL THEN to_timestamp(act_msg.read_at / 1000)
        WHEN act_msg.received_at IS NOT NULL THEN to_timestamp(act_msg.received_at / 1000)
        WHEN act_msg.status_id = -1 THEN to_timestamp(act_msg.status_changed_at / 1000)
        ELSE to_timestamp(cc.send_at / 1000)
    END AS data_status_envio,
    CASE
        WHEN conv.closed_by IS NULL AND mem.member_id IS NOT NULL THEN 'em_atendimento'
        WHEN conv.closed_by IS NULL AND conv.assigned_to_team_id IS NOT NULL THEN 'na_fila_para_atendimento'
        WHEN conv.closed_by IS NULL THEN 'em_atendimento_com_bot'
        ELSE 'atendimento_finalizado'
    END AS status_atendimento,
    mem.name AS nome_agente_assumiu,
    mem.member_id AS id_agente_assumiu,
    rat.value AS nota_final_atendimento,
    rat.rating_at AS data_envio_nota_final_atendimento
FROM
    campaign.campaign camp
INNER JOIN
    campaign.campaign_contact cc ON cc.campaign_id = camp.id
LEFT JOIN
    campaign.contact con ON cc.contact_id = con.id
LEFT JOIN
    active_message.active_message act_msg ON act_msg.external_id = cc.hash
LEFT JOIN
    analytics.member mem ON mem.conversation_id = act_msg.conversation_id AND mem.type = 'agent'
LEFT JOIN
    analytics.conversation conv ON conv.id = act_msg.conversation_id
LEFT JOIN
    rating.rating rat ON rat.conversation_id = act_msg.conversation_id
WHERE
    camp.workspace_id = $1
    AND camp.ended_at IS NOT NULL
    AND camp.started_at >= $2
    AND camp.started_at <= $3
`;

        const result = await this.connection.query(query, [workspaceId, startDate, endDate]);

        return result;
    }

    @CatchError()
    async getUserList(workspaceId: string): Promise<Result_getUserList[]> {
        return await this.externalDataService.reportGetAllWorkspaceUser(workspaceId);
    }
}
