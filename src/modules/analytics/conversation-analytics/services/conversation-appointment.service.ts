import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import * as moment from 'moment';
import * as Sentry from '@sentry/node';
import { Exceptions } from '../../../auth/exceptions';
import { DefaultTimezone } from '../../../../common/utils/defaultTimezone';
import { ConversationAppointmentFilterDto } from '../dto/conversation-appointment-filter.dto';
import { ANALYTICS_READ_CONNECTION } from '../../ormconfig';
import { ConversationAppointmentResult } from '../interfaces/conversation-appointment.interface';
import { DefaultRequest, DefaultResponse } from '../../../../common/interfaces/default';

@Injectable()
export class ConversationAppointmentService {
    private readonly logger = new Logger(ConversationAppointmentService.name);

    constructor(
        @InjectConnection(ANALYTICS_READ_CONNECTION)
        private readonly connection: Connection,
    ) {}

    async getConversationAppointments(
        filterData: DefaultRequest<ConversationAppointmentFilterDto>,
    ): Promise<ConversationAppointmentResult[] | DefaultResponse<ConversationAppointmentResult[]>> {
        try {
            const filter = filterData.data;
            this.validateDateRange(filter);

            const timezone = filter.timezone || DefaultTimezone;

            const startDate = moment.tz(filter.startDate, timezone).startOf('day').utc();
            const endDate = moment.tz(filter.endDate, timezone).endOf('day').utc();

            let query = `
            SELECT
                cv.iid,
                mu.member_id AS telefone_paciente,
                TRIM(BOTH '"' FROM ca.attribute_value::text) AS cpf_paciente,
                TO_CHAR(TO_TIMESTAMP(cv.created_at / 1000) AT TIME ZONE '${timezone}', 'DD/MM/YYYY HH24:MI') AS data_criacao_atendimento,
                TO_CHAR(TO_TIMESTAMP(cv.metrics_close_at / 1000) AT TIME ZONE '${timezone}', 'DD/MM/YYYY HH24:MI') AS data_finalizacao_atendimento,
                cv.assigned_to_team_id AS time_id,
                team.name AS nome_time,
                CASE
                    WHEN ma.type IN ('system', 'bot') THEN 'Bot'
                    ELSE ma.name
                END AS nome_agente,
                CASE
                    WHEN cv.created_by_channel = 'webchat' THEN 'Webchat'
                    WHEN cv.created_by_channel = 'whatsapp-gupshup' THEN 'WhatsApp'
                    WHEN cv.created_by_channel = 'live-agent' THEN 'Agente'
                    WHEN cv.created_by_channel = 'telegram' THEN 'Telegram'
                    WHEN cv.created_by_channel = 'api' THEN 'API'
                    WHEN cv.created_by_channel = 'campaign' THEN 'Lista de transmissão'
                    WHEN cv.created_by_channel = 'confirmation' THEN 'Confirmação'
                    WHEN cv.created_by_channel = 'reminder' THEN 'Lembrete'
                    WHEN cv.created_by_channel = 'nps' THEN 'Pesquisa de Satisfação'
                    WHEN cv.created_by_channel = 'medical_report' THEN 'Laudo Médico'
                    WHEN cv.created_by_channel = 'ads' THEN 'Publicidade'
                    WHEN cv.created_by_channel = 'api_ivr' THEN 'API URA'
                    WHEN cv.created_by_channel = 'schedule_notification' THEN 'Notificação de Agendamento'
                    WHEN cv.created_by_channel = 'recover_lost_schedule' THEN 'Recuperação de Agendamento'
                    WHEN cv.created_by_channel = 'nps_score' THEN 'NPS Avaliação'
                    WHEN cv.created_by_channel = 'documents_request' THEN 'Solicitação de Documentos'
                    WHEN cv.created_by_channel = 'active_mkt' THEN 'Marketing Ativo'
                    ELSE cv.created_by_channel
                END AS canal,
                cv.tags AS etiquetas,
                CASE
                    WHEN cv.state = 'open' THEN 'Aberto'
                    WHEN cv.state = 'closed' THEN 'Fechado'
                    ELSE cv.state
                END AS status_conversa,
                'https://app.botdesigner.io/live-agent?workspace=' || cv.workspace_id ||
                '&conversation=' || cv.id AS url_conversa
                ${
                    filter.includeAppointmentDetails
                        ? `,
                ap.appointment_code AS "codigo_agendamento",
                TO_CHAR(TO_TIMESTAMP(ap.appointment_date / 1000), 'DD/MM/YYYY HH24:MI') AS "data_agendamento",
                CASE
                    WHEN ap.appointment_status = -1 THEN 'erro'
                    WHEN ap.appointment_status = 0 THEN 'Agendamento não concluído'
                    WHEN ap.appointment_status = 1 THEN 'agendado'
                    WHEN ap.appointment_status = 2 THEN 'sem horários'
                    WHEN ap.appointment_status = 4 THEN 'Redirecionado pelo fluxo'
                    ELSE NULL
                END AS "status_agendamento",
                ap.appointment_type_name AS "tipo_agendamento",
                ap.avaliable_date_count AS "quantidade_datas_disponiveis",
                ap.choose_doctor AS "escolheu_medico",
                ap.doctor_name AS "nome_medico",
                TO_CHAR(TO_TIMESTAMP(ap.first_avaliable_date / 1000), 'DD/MM/YYYY HH24:MI') AS "primeira_data_disponivel",
                ap.insurance_category_name AS "categoria_convenio",
                ap.insurance_name AS "nome_convenio",
                ap.insurance_plan_name AS "plano_convenio",
                ap.insurance_sub_plan_name AS "sub_plano_convenio",
                TO_CHAR(TO_TIMESTAMP(ap.last_patient_appointment_date / 1000), 'DD/MM/YYYY HH24:MI') AS "data_ultimo_agendamento_paciente",
                TO_CHAR(TO_TIMESTAMP(ap.next_patient_appointment_date / 1000), 'DD/MM/YYYY HH24:MI') AS "data_proximo_agendamento_paciente",
                ap.occupation_area_name AS "area_profissional",
                ap.organization_unit_location_name AS "localizacao_unidade",
                ap.organization_unit_name AS "nome_unidade",
                ap.patient_age AS "idade_paciente",
                ap.patient_code AS "codigo_paciente",
                CASE
                    WHEN ap.period_of_day = 0 THEN 'Manhã'
                    WHEN ap.period_of_day = 1 THEN 'Tarde'
                    WHEN ap.period_of_day = 2 THEN 'Indiferente'
                    ELSE NULL
                END AS "periodo_dia",
                ap.procedure_name AS "nome_procedimento",
                ap.reason_name AS "nome_motivo",
                ap.reason_text AS "texto_motivo",
                ap.speciality_name AS "nome_especialidade",
                CASE
                    WHEN ap.step = 'listAppointments' THEN 'Listagem de horários'
                    WHEN ap.step = 'doAppointment' THEN 'Marcação de horário'
                    WHEN ap.step = 'organizationUnit' THEN 'Unidade organizacional'
                    WHEN ap.step = 'speciality' THEN 'Especialidade'
                    WHEN ap.step = 'insurance' THEN 'Convênio'
                    WHEN ap.step = 'insurancePlan' THEN 'Plano de convênio'
                    WHEN ap.step = 'procedure' THEN 'Procedimento'
                    WHEN ap.step = 'procedure_search' THEN 'Busca de procedimento'
                    WHEN ap.step = 'doctor' THEN 'Médico'
                    WHEN ap.step = 'appointmentType' THEN 'Tipo de agendamento'
                    WHEN ap.step = 'planCategory' THEN 'Categoria do plano'
                    WHEN ap.step = 'insuranceSubPlan' THEN 'Sub plano de convênio'
                    WHEN ap.step = 'occupationArea' THEN 'Área de ocupação'
                    WHEN ap.step = 'organizationUnitLocation' THEN 'Localização da unidade'
                    WHEN ap.step = 'group' THEN 'Grupo'
                    WHEN ap.step = 'choose_doctor' THEN 'Escolher médico'
                    WHEN ap.step = 'choose_day_period' THEN 'Escolher período do dia'
                    WHEN ap.step = 'listPatientSchedules' THEN 'Listar agendamentos do paciente'
                    WHEN ap.step = 'cancel' THEN 'Cancelar'
                    WHEN ap.step = 'confirmAppointment' THEN 'Confirmar agendamento'
                    WHEN ap.step = 'reschedule' THEN 'Reagendar'
                    WHEN ap.step = 'typeOfService' THEN 'Tipo de serviço'
                    WHEN ap.step = 'confirmPassive' THEN 'Confirmar passiva'
                    WHEN ap.step = 'confirmActive' THEN 'Confirmar ativa'
                    WHEN ap.step = 'reason' THEN 'Motivo'
                    WHEN ap.step = 'laterality' THEN 'Lateralidade'
                    WHEN ap.step = 'confirmPresence' THEN 'Confirmar presença'
                    WHEN ap.step = 'appointmentValue' THEN 'Valor do agendamento'
                    ELSE ap.step
                END AS "etapa",
                ap.type_of_service_name AS "tipo_servico"
                `
                        : ''
                }
            FROM analytics.conversation_view cv
            LEFT JOIN analytics.appointment ap
                ON ap.workspace_id = cv.workspace_id
                AND ap.conversation_id = cv.id
            LEFT JOIN analytics.member mu
                ON mu.conversation_id = cv.id
                AND mu.type = 'user'
            LEFT JOIN analytics.member ma
                ON ma.conversation_id = cv.id
                AND ma.type = 'agent'
                AND ma.member_id = cv.closed_by
            LEFT JOIN conversation.conversation_attribute ca
                ON ca.conversation_id = cv.id
                AND ca.workspace_id = cv.workspace_id
                AND ca.attribute_type = '@sys.cpf'
            LEFT JOIN core.teams team
                ON team.id = cv.assigned_to_team_id
            WHERE cv.workspace_id = $1
                AND cv.created_at >= $2
                AND cv.created_at <= $3
        `;

            const params: any[] = [filter.workspaceId, startDate.valueOf(), endDate.valueOf()];
            let paramIndex = 4;

            if (filter.teamIds && filter.teamIds.length > 0) {
                query += ` AND cv.assigned_to_team_id IN (${filter.teamIds
                    .map((_, i) => `$${paramIndex + i}`)
                    .join(', ')})`;
                params.push(...filter.teamIds);
                paramIndex += filter.teamIds.length;
            }

            if (filter.agentIds && filter.agentIds.length > 0) {
                query += ` AND cv.closed_by IN (${filter.agentIds.map((_, i) => `$${paramIndex + i}`).join(', ')})`;
                params.push(...filter.agentIds);
                paramIndex += filter.agentIds.length;
            }

            if (filter.channelId) {
                query += ` AND cv.created_by_channel = $${paramIndex}`;
                params.push(filter.channelId);
                paramIndex++;
            }

            if (filter.tags && filter.tags.length > 0) {
                const truthyTags: string[] = filter.tags.map((tag) => tag.trim()).filter((tag) => !!tag);
                if (truthyTags.length > 0) {
                    // o formato dessa query é -> where conv.tags @> '{tag 1, tag2, tag n}'
                    // por isso a formatação em javascript de ['tag 1', 'tag 2', 'tag n'] para string
                    query += ` AND cv.tags @> $${paramIndex}`;
                    params.push(`{${truthyTags.join(',')}}`);
                    paramIndex++;
                }
            }

            // Filtro de state: diferenciar entre status de conversa (open/closed) e status de appointment
            if (filter.state && filter.state.length > 0) {
                const conversationStates = filter.state.filter((s) => s === 'open' || s === 'closed');
                const appointmentStatuses = filter.state.filter((s) => s !== 'open' && s !== 'closed');

                // Se tem ambos 'open' e 'closed', não aplica filtro de conversa (traz todos)
                if (conversationStates.length === 1) {
                    query += ` AND cv.state = $${paramIndex}`;
                    params.push(conversationStates[0]);
                    paramIndex++;
                }

                // Filtro de appointment status
                if (appointmentStatuses.length > 0) {
                    // Converter strings para números conforme enum AppointmentStatus
                    const appointmentStatusNumbers = appointmentStatuses.map((status) => {
                        switch (status) {
                            case 'error':
                                return -1;
                            case 'inProgress':
                                return 0;
                            case 'scheduled':
                                return 1;
                            case 'withoutSchedules':
                                return 2;
                            case 'withoutEntities':
                                return 3;
                            case 'redirected':
                                return 4;
                            default:
                                return parseInt(status, 10);
                        }
                    });

                    if (appointmentStatusNumbers.length === 1) {
                        query += ` AND ap.appointment_status = $${paramIndex}`;
                        params.push(appointmentStatusNumbers[0]);
                        paramIndex++;
                    } else {
                        query += ` AND ap.appointment_status IN (${appointmentStatusNumbers
                            .map((_, i) => `$${paramIndex + i}`)
                            .join(', ')})`;
                        params.push(...appointmentStatusNumbers);
                        paramIndex += appointmentStatusNumbers.length;
                    }
                }
            }

            query += ` ORDER BY cv.created_at DESC`;

            // Se page e limit foram fornecidos, aplicar paginação
            const isPaginated = filterData?.skip >= 0 && filterData.limit;

            if (isPaginated) {
                // Fazer query de contagem total antes de aplicar LIMIT/OFFSET
                // const countQuery = `
                //     SELECT COUNT(*) as total
                //     FROM (${query}) as count_subquery
                // `;
                // const countResult = await this.connection.query(countQuery, params);
                // const total = parseInt(countResult[0].total, 10);

                // Aplicar LIMIT e OFFSET
                const skip = filterData.skip;
                const limit = filterData.limit;

                query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
                params.push(limit, skip);

                const result = await this.connection.query(query, params);

                return {
                    data: result,
                    metadata: {
                        count: -1,
                        skip,
                        limit,
                    },
                };
            }

            // Sem paginação, retornar array direto (para CSV download)
            const result = await this.connection.query(query, params);
            return result;
        } catch (error) {
            this.logger.error('Error fetching conversation appointments:', error);
            Sentry.captureEvent({
                message: 'ERROR ConversationAppointmentService.getConversationAppointments',
                extra: {
                    error: error,
                    filters: filterData,
                },
            });
            throw error;
        }
    }

    private validateDateRange(filter: ConversationAppointmentFilterDto): void {
        const startDate = moment(filter.startDate);
        const endDate = moment(filter.endDate);

        if (!startDate.isValid() || !endDate.isValid()) {
            throw Exceptions.INVALID_DATE_RANGE;
        }

        const diffInDays = endDate.diff(startDate, 'days');

        if (diffInDays > 31) {
            throw Exceptions.DATE_RANGE_EXCEEDS_ONE_MONTH;
        }

        if (diffInDays < 0) {
            throw Exceptions.END_DATE_BEFORE_START_DATE;
        }
    }
}
