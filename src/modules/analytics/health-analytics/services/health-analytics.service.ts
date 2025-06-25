import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ANALYTICS_CONNECTION, ANALYTICS_READ_CONNECTION } from '../../ormconfig';
import { HealthAnalyticsFilters } from '../interfaces/health-analytics-filters';
import {
    Appointment,
    AppointmentConfirmed,
    AppointmentPeriod,
    AppointmentStatus,
    ListPatientAppointmentStatus,
} from 'kissbot-entities';
import { User } from '../../../../modules/users/interfaces/user.interface';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../../../../common/utils/roles';
import * as moment from 'moment';
import { DefaultTimezone } from '../../../../common/utils/defaultTimezone';

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

        if (isWorkspaceAdmin(user, filters.workspaceId) || (filters?.ommitFields && isAnySystemAdmin(user))) {
            const pivotFields = filters.pivotConfig ?? [];
            const availableColumns = this.appointmentReadRepository.metadata.columns.map((col) => col.propertyName);
            const validFields = pivotFields.filter((field) => availableColumns.includes(field));

            if (validFields.length > 0) {
                const dynamicFields = [
                    ...validFields.map((f) => `appo.${f}`),
                    'appo.conversationId',
                    'appo.workspaceId',
                    'appo.timestamp',
                ];
                query.select(dynamicFields);
            } else {
                query.select([
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
                    'appo.workspaceId',
                    'appo.timestamp',
                    'appo.reasonName',
                    'appo.reasonText',
                    'appo.periodOfDay',
                    'appo.chooseDoctor',
                    'appo.patientAge',
                ]);
            }
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
        }

        const formatValue = (key: string, value: any) => {
            let newValue = value || ' ';

            switch (key) {
                case 'appointmentStatus':
                    switch (value) {
                        case AppointmentStatus.error:
                            newValue = 'erro';
                            break;
                        case AppointmentStatus.inProgress:
                            newValue = 'em progresso';
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
                case 'timestamp':
                    newValue = moment(Number(value)).format('DD/MM/YYYY - HH:mm');
                    break;
            }
            return newValue;
        };

        const formatData = result.map((appointment) => {
            const data = {} as Record<string, any>;
            Object.keys(appointment).forEach((key) => {
                if (ChangeFieldName[key as keyof typeof ChangeFieldName]) {
                    if (key === 'conversationId') {
                        data[ChangeFieldName[key as keyof typeof ChangeFieldName]] = formatValue(
                            'conversationUrl',
                            appointment['conversationId'],
                        );
                        return;
                    }
                    data[ChangeFieldName[key as keyof typeof ChangeFieldName]] = formatValue(
                        key,
                        (appointment as any)[key],
                    );
                }
            });
            return data;
        });

        return formatData;
    }
}
