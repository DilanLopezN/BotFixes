import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelIdConfig } from 'kissbot-core';
import {
    Appointment,
    AppointmentConfirmed,
    AppointmentPeriod,
    AppointmentStatus,
    ListPatientAppointmentStatus,
} from 'kissbot-entities';
import * as moment from 'moment';
import { Repository } from 'typeorm';
import { DefaultTimezone } from '../../../../common/utils/defaultTimezone';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../../../../common/utils/roles';
import { User } from '../../../../modules/users/interfaces/user.interface';
import { ANALYTICS_CONNECTION, ANALYTICS_READ_CONNECTION } from '../../ormconfig';
import { HealthAnalyticsFilters } from '../interfaces/health-analytics-filters';

@Injectable()
export class HealthAnalyticsService {
    constructor(
        @InjectRepository(Appointment, ANALYTICS_CONNECTION)
        private appointmentRepository: Repository<Appointment>,
        @InjectRepository(Appointment, ANALYTICS_READ_CONNECTION)
        private appointmentReadRepository: Repository<Appointment>,
    ) {}

    public async getAll(filters: HealthAnalyticsFilters, user: User): Promise<Appointment[]> {
        const query = this.appointmentReadRepository
            .createQueryBuilder('appo')
            .where('appo.workspace_id = :workspaceId', { workspaceId: filters.workspaceId });

        const fields = [
            'appo.organizationUnitName',
            'appo.occupationAreaName',
            'appo.appointmentTypeName',
            'appo.typeOfServiceName',
            'appo.insuranceName',
            'appo.specialityName',
            'appo.procedureName',
            'appo.doctorName',
            'appo.insurancePlanName',
            'appo.insuranceSubPlanName',
            'appo.insuranceCategoryName',
            'appo.appointmentStatus',
            'appo.step',
            'appo.conversationId',
            'appo.reasonName',
            'appo.reasonText',
            'appo.channelId',
            'appo.appointmentCode',
            'appo.appointmentDate',
            'appo.organizationUnitLocationName',
            'appo.patientCode',
            'appo.periodOfDay',
            'appo.chooseDoctor',
            'appo.patientAge',
        ];

        if (!isWorkspaceAdmin(user, filters.workspaceId) && !isAnySystemAdmin(user)) {
            return [];
        }

        if (!filters?.ommitFields && isAnySystemAdmin(user)) {
            const properties = [
                'appo.lastPatientAppointmentDate',
                'appo.nextPatientAppointmentDate',
                'appo.avaliableDateCount',
                'appo.firstAvaliableDate',
            ];
            fields.push(...properties);
        }

        query.select(fields);

        if (filters.startDate && filters.endDate) {
            const startDate = moment(filters.startDate)
                .tz(filters?.timezone || DefaultTimezone)
                .startOf('day')
                .utc();
            const endDate = moment(filters.endDate)
                .tz(filters?.timezone || DefaultTimezone)
                .endOf('day')
                .utc();
            query.andWhere('appo.timestamp >= :startDate AND appo.timestamp <= :endDate', {
                startDate: startDate.valueOf(),
                endDate: endDate.valueOf(),
            });
        }

        if (filters.channelIds?.length) {
            const channels = filters.channelIds.map((id) => `'${id}'`).join(',');
            query.andWhere(`appo.channel_id IN(${channels})`);
        }

        if (filters.botId) {
            query.andWhere('appo.bot_id = :botId', { botId: filters.botId });
        }

        if (filters.teamIds?.length || filters.tags?.length) {
            query.innerJoin('conversation', 'conv', 'appo.conversation_id = conv.id');

            if (filters.teamIds?.length) {
                const teams = filters.teamIds.map((id) => `'${id}'`).join(',');
                query.andWhere(`conv.assigned_to_team_id IN(${teams})`);
            }

            if (filters.tags?.length) {
                const truthyTags: string[] = filters.tags.map((tag) => tag.trim());
                query.andWhere(`conv.tags @> :tags`, {
                    tags: `{${truthyTags.toString()}}`,
                });
            }
        }

        return await query.getMany();
    }

    public async upsert(_: string, appointment: Appointment) {
        const savedAppointment = await this.appointmentRepository.findOne({
            conversationId: appointment.conversationId,
        });

        if (!savedAppointment) {
            return await this.appointmentRepository.createQueryBuilder().insert().values(appointment).execute();
        }

        return await this.appointmentRepository
            .createQueryBuilder()
            .update()
            .set(appointment)
            .where('id = :id', { id: savedAppointment.id })
            .execute();
    }

    public async create(_: string, appointment: Appointment) {
        return await this.appointmentRepository.createQueryBuilder().insert().values(appointment).execute();
    }

    public async update(_: string, appointment: Appointment) {
        return await this.appointmentRepository
            .createQueryBuilder()
            .update()
            .set(appointment)
            .where('id = :id', { id: appointment.id })
            .execute();
    }

    public async exportData(filters: HealthAnalyticsFilters, user: User): Promise<any> {
        const query = this.appointmentReadRepository
            .createQueryBuilder('appo')
            .where('appo.workspace_id = :workspaceId', { workspaceId: filters.workspaceId });

        const defaultSelectableFields = [
            'organizationUnitName',
            'occupationAreaName',
            'appointmentTypeName',
            'typeOfServiceName',
            'insuranceName',
            'specialityName',
            'procedureName',
            'doctorName',
            'insurancePlanName',
            'insuranceSubPlanName',
            'insuranceCategoryName',
            'appointmentStatus',
            'step',
            'conversationId',
            'timestamp',
            'reasonName',
            'reasonText',
            'periodOfDay',
            'chooseDoctor',
            'patientAge',
        ];

        const fixedVisibleFields = ['conversationUrl', 'timestamp'];
        const availableColumns = this.appointmentReadRepository.metadata.columns.map((col) => col.propertyName);
        const availableColumnsSet = new Set<string>(availableColumns);

        const dedupe = (fields: string[]) => {
            const seen = new Set<string>();
            return fields.filter((field) => {
                if (field === 'conversationId' && seen.has('conversationUrl')) {
                    return false;
                }
                if (!field || seen.has(field)) {
                    return false;
                }
                seen.add(field);
                return true;
            });
        };

        const toSelectableColumn = (field: string) => (field === 'conversationUrl' ? 'conversationId' : field);
        const selectedColumns = new Set<string>();
        let outputFieldOrder = dedupe([...fixedVisibleFields]);

        const ensureSelectableColumns = (fields: string[]) => {
            fields.forEach((field) => {
                const selectable = toSelectableColumn(field);
                if (selectable) {
                    selectedColumns.add(selectable);
                }
            });
        };

        const canUsePivotSelection =
            isWorkspaceAdmin(user, filters.workspaceId) || (filters?.ommitFields && isAnySystemAdmin(user));

        if (canUsePivotSelection) {
            const pivotFields = (filters.pivotConfig ?? []).filter(Boolean);
            const normalizedPivotFields = pivotFields.filter((field) => {
                if (field === 'conversationUrl') {
                    return true;
                }
                return availableColumnsSet.has(field);
            });

            outputFieldOrder = dedupe([...fixedVisibleFields, ...normalizedPivotFields]);
            ensureSelectableColumns(outputFieldOrder);

            Object.keys(filters.pivotValueFilter || {}).forEach((field) => {
                if (field === 'conversationUrl') {
                    selectedColumns.add('conversationId');
                    return;
                }

                if (availableColumnsSet.has(field)) {
                    selectedColumns.add(field);
                }
            });

            if (selectedColumns.size === 0) {
                outputFieldOrder = dedupe([...fixedVisibleFields, ...defaultSelectableFields]);
                ensureSelectableColumns(outputFieldOrder);
            }
        } else {
            outputFieldOrder = dedupe([...fixedVisibleFields, ...defaultSelectableFields]);
            ensureSelectableColumns(outputFieldOrder);
        }

        if (selectedColumns.size > 0) {
            query.select(Array.from(selectedColumns).map((field) => `appo.${field}`));
        } else {
            query.select(defaultSelectableFields.map((field) => `appo.${field}`));
            outputFieldOrder = dedupe([...fixedVisibleFields, ...defaultSelectableFields]);
        }

        if (filters.startDate && filters.endDate) {
            const startDate = moment(filters.startDate)
                .tz(filters?.timezone || DefaultTimezone)
                .startOf('day')
                .utc();
            const endDate = moment(filters.endDate)
                .tz(filters?.timezone || DefaultTimezone)
                .endOf('day')
                .utc();
            query.andWhere('appo.timestamp >= :startDate AND appo.timestamp <= :endDate', {
                startDate: startDate.valueOf(),
                endDate: endDate.valueOf(),
            });
        }

        const result = await query.getMany();

        const normalizedRequestedFields = outputFieldOrder
            .filter(Boolean)
            .map((field) => (field === 'conversationUrl' ? 'conversationId' : field));

        enum ChangeFieldName {
            'organizationUnitName' = 'Unidades',
            'occupationAreaName' = 'Area_de_ocupacao',
            'appointmentTypeName' = 'Tipo_de_agendamento',
            'typeOfServiceName' = 'Tipo_de_servico',
            'insuranceName' = 'Convenio',
            'specialityName' = 'Especialidade',
            'procedureName' = 'Procedimento',
            'doctorName' = 'Medico',
            'insurancePlanName' = 'Plano_do_convenio',
            'insuranceSubPlanName' = 'Sub_plano_do_convenio',
            'insuranceCategoryName' = 'Categoria_do_convenio',
            'appointmentStatus' = 'Status_do_agendamento',
            'step' = 'Etapa',
            'timestamp' = 'Data_Hora',
            'reasonName' = 'Motivo_nao_agendamento',
            'reasonText' = 'Motivo_nao_agendamento_observacao',
            'conversationId' = 'Url_conversa',
            'periodOfDay' = 'Periodo_do_dia',
            'chooseDoctor' = 'Escolha_do_medico',
            'patientAge' = 'Idade_do_paciente',
            'channelId' = 'Canal',
            'appointmentCode' = 'Codigo_do_agendamento',
            'appointmentDate' = 'Data_do_agendamento',
            'patientCode' = 'Codigo_do_paciente_ERP',
            'organizationUnitLocationName' = 'Codigo_localizacao_unidade',
            'appointmentConfirmed' = 'Confirmacao_do_agendamento',
            'appointmentPeriod' = 'Periodo_do_agendamento',
            'listPatientAppointmentStatus' = 'Status_lista_paciente',
            'lastPatientAppointmentDate' = 'Data_ultima_consulta_paciente',
            'nextPatientAppointmentDate' = 'Proxima_data_consulta_paciente',
            'firstAvaliableDate' = 'Primeira_data_disponivel',
            'retryFirstAvaliableDate' = 'Primeira_data_disponivel_retentativa',
            'avaliableDateCount' = 'Quantidade_datas_disponiveis',
        }

        const formatDate = (raw: any, pattern: string) => {
            const numeric = Number(raw);
            const date = !Number.isNaN(numeric) ? moment(numeric) : moment(raw);
            return date.isValid() ? date.format(pattern) : raw;
        };

        const formatValue = (key: string, value: any) => {
            let newValue: any = value || value === 0 ? value : '';

            switch (key) {
                case 'appointmentStatus':
                    switch (value) {
                        case AppointmentStatus.error:
                            newValue = 'erro';
                            break;
                        case AppointmentStatus.inProgress:
                            newValue = 'Agendamentos não concluídos';
                            break;
                        case AppointmentStatus.scheduled:
                            newValue = 'agendado';
                            break;
                        case AppointmentStatus.withoutSchedules:
                            newValue = 'sem horários';
                            break;
                        case AppointmentStatus.withoutEntities:
                            newValue = 'sem entidades';
                            break;
                        case AppointmentStatus.redirected:
                            newValue = 'Redirecionado pelo fluxo';
                            break;
                    }
                    break;
                case 'appointmentConfirmed':
                    switch (value) {
                        case AppointmentConfirmed.inProgress:
                            newValue = 'em progresso';
                            break;
                        case AppointmentConfirmed.notConfirmed:
                            newValue = 'não confirmado';
                            break;
                        case AppointmentConfirmed.confirmed:
                            newValue = 'confirmado';
                            break;
                    }
                    break;
                case 'appointmentPeriod':
                    switch (value) {
                        case AppointmentPeriod.morning:
                            newValue = 'manhã';
                            break;
                        case AppointmentPeriod.afternoon:
                            newValue = 'tarde';
                            break;
                        case AppointmentPeriod.indifferent:
                            newValue = 'indiferente';
                            break;
                    }
                    break;
                case 'listPatientAppointmentStatus':
                    switch (value) {
                        case ListPatientAppointmentStatus.error:
                            newValue = 'erro';
                            break;
                        case ListPatientAppointmentStatus.success:
                            newValue = 'successo';
                            break;
                    }
                    break;
                case 'conversationUrl':
                    newValue = `https://app.botdesigner.io/live-agent?workspace=${filters.workspaceId}&conversation=${value}`;
                    break;
                case 'appointmentDate':
                case 'lastPatientAppointmentDate':
                case 'firstAvaliableDate':
                case 'retryFirstAvaliableDate':
                    newValue = formatDate(value, 'DD/MM/YYYY');
                    break;
                case 'nextPatientAppointmentDate':
                    newValue = formatDate(value, 'DD/MM/YYYY - HH:mm');
                    break;
                case 'timestamp':
                    newValue = formatDate(value, 'DD/MM/YYYY - HH:mm');
                    break;
                case 'channelId':
                    switch (value) {
                        case ChannelIdConfig.webchat:
                            newValue = 'Webchat';
                            break;
                        case ChannelIdConfig.webemulator:
                            newValue = 'Emulador';
                            break;
                        case ChannelIdConfig.emulator:
                            newValue = 'Emulador';
                            break;
                        case ChannelIdConfig.wabox:
                            newValue = 'Whatsapp';
                            break;
                        case ChannelIdConfig.whatsapp:
                            newValue = 'WhatsApp';
                            break;
                        case ChannelIdConfig.sms:
                            newValue = 'SMS';
                            break;
                        case ChannelIdConfig.gupshup:
                            newValue = 'WhatsApp';
                            break;
                        case ChannelIdConfig.d360:
                            newValue = 'WhatsApp';
                            break;
                        case ChannelIdConfig.whatsweb:
                            newValue = 'WhatsApp Web';
                            break;
                        case ChannelIdConfig.liveagent:
                            newValue = 'Agente';
                            break;
                        case ChannelIdConfig.kissbot:
                            newValue = 'Bot';
                            break;
                        case ChannelIdConfig.telegram:
                            newValue = 'Telegram';
                            break;
                        case ChannelIdConfig.rating:
                            newValue = 'Avaliação';
                            break;
                        case ChannelIdConfig.facebook:
                            newValue = 'Facebook';
                            break;
                        case ChannelIdConfig.instagram:
                            newValue = 'Instagram';
                            break;
                        case ChannelIdConfig.api:
                            newValue = 'Api';
                            break;
                        case ChannelIdConfig.campaign:
                            newValue = 'Lista de transmissão';
                            break;
                        case ChannelIdConfig.confirmation:
                            newValue = 'Confirmação';
                            break;
                        case ChannelIdConfig.reminder:
                            newValue = 'Lembrete';
                            break;
                        case ChannelIdConfig.nps:
                            newValue = 'Link pesquisa de satisfação';
                            break;
                        case ChannelIdConfig.medical_report:
                            newValue = 'Laudo médico';
                            break;
                        case ChannelIdConfig.ads:
                            newValue = 'Publicidade';
                            break;
                        case ChannelIdConfig.api_ivr:
                            newValue = 'URA';
                            break;
                        case ChannelIdConfig.schedule_notification:
                            newValue = 'Notificação de agendamento';
                            break;
                        case ChannelIdConfig.recover_lost_schedule:
                            newValue = 'Resgate de agendamento perdido';
                            break;
                        case ChannelIdConfig.nps_score:
                            newValue = 'NPS';
                            break;
                        case ChannelIdConfig.documents_request:
                            newValue = 'Solicitação de documentos';
                            break;
                        case ChannelIdConfig.active_mkt:
                            newValue = 'Marketing ativo';
                            break;
                        default:
                            newValue = value;
                            break;
                    }
                    break;
            }
            return newValue;
        };

        const excludedMap = filters.pivotValueFilter || {};
        const filteredResult = result.filter((appointment: any) => {
            for (const key of Object.keys(excludedMap)) {
                const excludedValues = excludedMap[key] || {};
                let compareValue: any;
                if (key === 'conversationUrl') {
                    compareValue = formatValue('conversationUrl', appointment['conversationId']);
                } else if (key === 'timestamp') {
                    compareValue = formatValue('timestamp', appointment['timestamp']);
                } else {
                    compareValue = formatValue(key, appointment[key]);
                }
                if (Object.prototype.hasOwnProperty.call(excludedValues, String(compareValue))) {
                    return false;
                }
            }
            return true;
        });

        const headerForField = (field: string) => ChangeFieldName[field as keyof typeof ChangeFieldName] || field;

        const formatData = filteredResult.map((appointment) => {
            const data = {} as Record<string, any>;
            normalizedRequestedFields.forEach((field) => {
                if (field === 'conversationId') {
                    if (Object.prototype.hasOwnProperty.call(appointment, 'conversationId')) {
                        data[headerForField(field)] = formatValue('conversationUrl', appointment['conversationId']);
                    }
                    return;
                }

                if (!Object.prototype.hasOwnProperty.call(appointment, field)) {
                    return;
                }

                data[headerForField(field)] = formatValue(field, (appointment as any)[field]);
            });
            return data;
        });

        return formatData;
    }
}
