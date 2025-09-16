import { Injectable } from '@nestjs/common';
import { RecipientType } from '../../models/schedule-message.entity';
import { SendScheduleMessageData } from '../../interfaces/send-schedule-message-data.interface';
import * as moment from 'dayjs';
import {
  KissbotEventDataType,
  KissbotEventSource,
  KissbotEventType,
} from 'kissbot-core';
import * as Sentry from '@sentry/node';
import { Schedule } from '../../models/schedule.entity';
import { ExternalDataService } from '../external-data.service';
import { ExtractResumeType } from '../../models/extract-resume.entity';
import * as jwt from 'jsonwebtoken';
import { EventsService } from '../../../events/events.service';
import { KafkaService } from '../../../kafka/kafka.service';
import {
  generateDayPeriod,
  getCompletePhone,
} from '../../../miscellaneous/utils';
import { SendSchedule } from '../integration-api.service';
@Injectable()
export class SendScheduleMessageService {
  constructor(
    private readonly eventsService: EventsService,
    private readonly externalDataService: ExternalDataService,
    private kafkaService: KafkaService,
  ) {}

  async sendScheduleMessage(data: SendScheduleMessageData) {
    const { scheduleMessage } = data;
    switch (scheduleMessage.recipientType) {
      case RecipientType.whatsapp: {
        return await this.whatsStrategy(data);
      }
      case RecipientType.email: {
        return await this.emailStrategy(data);
      }
    }
  }

  private async whatsStrategy(data: SendScheduleMessageData): Promise<boolean> {
    const { scheduleMessage, schedule, sendScheduleMessageSetting, action } =
      data;

    const attributes = await this.getAttributes(
      { ...schedule, externalId: scheduleMessage.uuid },
      scheduleMessage.sendType,
      sendScheduleMessageSetting.templateId,
    );

    const phone = getCompletePhone(scheduleMessage.recipient);
    const event = {
      apiToken: sendScheduleMessageSetting.apiToken,
      templateId: sendScheduleMessageSetting.templateId,
      phoneNumber: phone,
      externalId: scheduleMessage.uuid,
      workspaceId: scheduleMessage.workspaceId,
      action,
      confirmationId: scheduleMessage.id,
      attributes: attributes,
      omitAction: !sendScheduleMessageSetting?.sendAction,
    };

    await this.sendEvent(event);

    return true;
  }

  private async emailStrategy(data: SendScheduleMessageData): Promise<boolean> {
    try {
      const {
        scheduleMessage,
        schedule,
        sendScheduleMessageSetting,
        orderedGroup,
      } = data;

      if (!scheduleMessage?.recipient) {
        return false;
      }

      const attributes = await this.getAttributes(
        { ...schedule, externalId: scheduleMessage.uuid },
        scheduleMessage.sendType,
        // Não esta passando o templateId pois o templateId enviado no email é diferente do enviado via whatsapp
        // sendScheduleMessageSetting.templateId,
      );

      const emailSendingSettingId =
        sendScheduleMessageSetting.emailSendingSettingId;

      if (!emailSendingSettingId) {
        return false;
      }

      const emailSendingSetting =
        await this.externalDataService.getEmailSendingSettingByWorkspaceIdAndId(
          scheduleMessage.workspaceId,
          emailSendingSettingId,
        );

      if (!emailSendingSetting) {
        return false;
      }

      const { templateId, versionId, templateVariables, emailType } =
        emailSendingSetting;

      const result = await this.externalDataService.getEmailTemplateByVersion(
        templateId,
        versionId,
      );

      const templateVariableKeys = result?.templateVariables || [];

      const templateDataByScheduleFiltered = attributes?.reduce(
        (total, currAttr) => {
          const key = currAttr.name;
          const value = currAttr.value;

          // add apenas variaveis que estejam contidas no template de email
          if (templateVariableKeys.includes(key)) {
            return { ...total, [key]: value };
          }

          return total;
        },
        {},
      );

      const templateData: any = {
        ...templateVariables, // aqui estão variaveis globais que não estão contidas no agendamento, como por exemplo (nome do cliente, link logo do hospital, endereço...)
        ...templateDataByScheduleFiltered, // aqui estão variaveis do agendamento que estão dentro do template de email
      };

      if (scheduleMessage.sendType === ExtractResumeType.confirmation) {
        const {
          appointments,
          multipleAppointments,
          scheduleCodes,
          scheduleIds,
        } = this.formatAppointmentsToSendEmail(orderedGroup);

        templateData.appointments = appointments;
        templateData.multipleAppointments = multipleAppointments;

        const confirmationScheduleDataEmail = {
          scheduleId: schedule.scheduleId,
          scheduleIds: scheduleIds,
          confirmationType: 'email',
          patientErpCode: schedule.patientCode,
          scheduleCode: schedule.scheduleCode,
          scheduleCodes: scheduleCodes,
          data: schedule.data,
          shortId: schedule.data?.shortId || null,
        };
        const token = jwt.sign(
          confirmationScheduleDataEmail,
          process.env.CF_TOKEN_KEY,
        );
        templateData.confirmLink = `${process.env.INTEGRATIONS_URL}/client/${schedule.integrationId}/scheduling-email/confirmSchedule?cfToken=${token}`;
        templateData.cancelLink = `${process.env.INTEGRATIONS_URL}/client/${schedule.integrationId}/scheduling-email/cancelSchedule?cfToken=${token}`;
        templateData.resumeLink = `${process.env.INTEGRATIONS_URL}/client/${schedule.integrationId}/scheduling-email/redirect-resume?cfToken=${token}`;
      } else if (
        scheduleMessage.sendType === ExtractResumeType.schedule_notification ||
        scheduleMessage.sendType === ExtractResumeType.reminder
      ) {
        const { appointments, multipleAppointments } =
          this.formatAppointmentsToSendEmail(orderedGroup);

        templateData.appointments = appointments;
        templateData.multipleAppointments = multipleAppointments;

        const confirmationScheduleDataEmail = {
          scheduleId: schedule.scheduleId,
          patientErpCode: schedule.patientCode,
          scheduleCode: schedule.scheduleCode,
          data: schedule.data,
          shortId: schedule.data?.shortId || null,
        };

        const token = jwt.sign(
          confirmationScheduleDataEmail,
          process.env.CF_TOKEN_KEY,
        );
        templateData.resumeLink = `${process.env.INTEGRATIONS_URL}/client/${schedule.integrationId}/scheduling-email/redirect-resume?cfToken=${token}`;
      }

      let title = '';
      let unsubscribeGroupId = undefined;

      const companyName = templateData.companyName
        ? templateData.companyName
        : '';

      switch (scheduleMessage.sendType) {
        case ExtractResumeType.confirmation:
          title = `${companyName} - Confirmação de Agendamento`;
          unsubscribeGroupId = 32055;
          break;

        case ExtractResumeType.schedule_notification:
          title = `${companyName} - Agendamento Realizado`;
          unsubscribeGroupId = 32056;
          break;

        case ExtractResumeType.reminder:
          // case para lembretes
          title = `${companyName} - Lembrete de Agendamento`;
          unsubscribeGroupId = 32568;
          break;

        default:
          title = companyName;
          break;
      }

      const eventData: any /*EmailCreatedMessage*/ = {
        fromEmail: 'confirmacao@atend.clinic',
        fromTitle: title,
        subject: '__', // Esse campo é opcional como esta indo com templateId ele é sobreescrito
        to: scheduleMessage.recipient,
        content: null,
        workspaceId: scheduleMessage.workspaceId,
        externalId: scheduleMessage.uuid,
        templateId: templateId,
        templateData: templateData,
        unsubscribeGroupId,
        ...this.buildEmailMessageByType(
          data,
          emailType,
          templateData,
          result.templateVersion,
        ),
      };

      await this.sendEmailEvent(scheduleMessage.workspaceId, eventData);

      return true;
    } catch (e) {
      Sentry.captureEvent({
        message:
          'SendScheduleMessageService.emailStrategy - error on sending email',
        extra: {
          error: e,
        },
      });
    }
  }
  formatAppointmentsToSendEmail(orderedGroup: SendSchedule[]) {
    let appointments = [];
    let scheduleCodes = [];
    let scheduleIds = [];
    let multipleAppointments = false;

    if (orderedGroup && orderedGroup?.length) {
      appointments = orderedGroup.map((data) => {
        const { schedule } = data;
        if (schedule?.scheduleCode) {
          scheduleCodes.push(schedule.scheduleCode);
        }
        if (schedule?.scheduleId) {
          scheduleIds.push(schedule.scheduleId);
        }

        return {
          scheduleDate: moment(schedule.scheduleDate)
            .locale('pt-br')
            .format('DD/MM/YYYY'),
          scheduleHour: moment(schedule.scheduleDate)
            .locale('pt-br')
            .format('HH:mm'),
          serviceType:
            schedule?.procedureName ||
            schedule.specialityName ||
            schedule?.doctorName ||
            null,
          professionalName: schedule?.doctorName || null,
          addressUnity:
            schedule?.organizationUnitAddress ||
            schedule?.organizationUnitName ||
            null,
        };
      });
      multipleAppointments = orderedGroup.length > 1;
    }

    return { appointments, multipleAppointments, scheduleCodes, scheduleIds };
  }

  async getAttributes(
    schedule: Schedule & { externalId?: string },
    sendType: ExtractResumeType,
    templateId?: string,
  ) {
    const { groupDescription, groupId, groupCodeList, groupIdList } = schedule;

    let groupDescriptionPrefix = '';
    try {
      groupDescriptionPrefix =
        groupCodeList?.split?.(',').length > 1
          ? 'seus *agendamentos* marcados para'
          : 'seu *agendamento* marcado para';
      try {
        const now = moment();
        const scheduleDate = moment(schedule.scheduleDate);
        if (now.format('DD/MM/YYYY') == scheduleDate.format('DD/MM/YYYY')) {
          groupDescriptionPrefix = `${groupDescriptionPrefix} *${scheduleDate
            .locale('pt-br')
            .format('[hoje] DD/MM/YYYY')}*:`;
        } else {
          groupDescriptionPrefix = `${groupDescriptionPrefix} *${moment(
            schedule.scheduleDate,
          )
            .locale('pt-br')
            .format('dddd DD/MM/YYYY')}*:`;
        }
      } catch (e) {
        groupDescriptionPrefix = `${groupDescriptionPrefix} *${moment(
          schedule.scheduleDate,
        )
          .locale('pt-br')
          .format('dddd DD/MM/YYYY')}*:`;
        Sentry.captureEvent({
          message:
            'SendScheduleMessageService.whatsStrategy - render today prefix',
          extra: {
            error: e,
          },
        });
      }
    } catch (e) {
      Sentry.captureEvent({
        message:
          'SendScheduleMessageService.whatsStrategy - groupDescriptionPrefix',
        extra: {
          error: e,
        },
      });
    }
    const scheduleDataAttributes =
      await this.buildScheduleDataAtttibutes(schedule);

    const attributes = [
      {
        name: 'confirmation_paciente_nome',
        type: '@sys.text',
        value: schedule.patientName,
        label: 'Nome do paciente',
      },
      {
        name: 'confirmation_primeiro_nome',
        type: '@sys.text',
        value: schedule.patientName?.split?.(' ')?.[0].trim(),
      },
      {
        name: 'confirmation_confirmacao_periodo_dia',
        type: '@sys.text',
        value: generateDayPeriod(schedule.scheduleDate),
        label: 'Periodo do dia',
      },
      {
        name: 'confirmation_confirmacao_data',
        type: '@sys.text',
        value: moment(schedule.scheduleDate).format('DD/MM/YYYY [às] HH:mm'),
      },
      {
        name: 'confirmation_confirmacao_data_completa',
        type: '@sys.text',
        value: moment(schedule.scheduleDate)
          .locale('pt-br')
          .format('dddd DD/MM/YYYY [às] HH:mm'),
        label: 'Data do agendamento',
      },
      {
        name: 'confirmation_confirmacao_data_dia',
        type: '@sys.text',
        value: moment(schedule.scheduleDate)
          .locale('pt-br')
          .format('dddd, DD/MM/YYYY'),
      },
      {
        name: 'confirmation_nome_procedimento',
        type: '@sys.text',
        value: schedule.procedureName,
        label: 'Nome do procedimento',
      },
      {
        name: 'confirmation_nome_procedimento_short',
        type: '@sys.text',
        value:
          schedule?.procedureName?.split?.(' ')?.[0] || schedule?.procedureName,
      },
      {
        name: 'confirmation_nome_especialidade',
        type: '@sys.text',
        value: schedule.specialityName,
        label: 'Nome da especialidade',
      },
      {
        name: 'confirmation_nome_medico',
        type: '@sys.text',
        value: schedule.doctorName,
        label: 'Nome do médico',
      },
      {
        name: 'confirmation_observacao_medico',
        type: '@sys.text',
        value: schedule.doctorObservation,
        label: 'Observação do médico',
      },
      {
        name: 'confirmation_endereco_unidade',
        type: '@sys.text',
        value: schedule.organizationUnitAddress,
        label: 'Endereço da unidade',
      },
      {
        name: 'confirmation_nome_unidade',
        type: '@sys.text',
        value: schedule.organizationUnitName,
        label: 'Nome da unidade',
      },
      {
        name: 'confirmation_tipo_agendamento',
        type: '@sys.text',
        value: schedule.appointmentTypeName,
        label: 'Tipo de agendamento',
      },
      {
        name: 'confirmation_schedule_code',
        type: '@sys.text',
        value: schedule.scheduleCode,
        label: 'Código do agendamento',
      },
      {
        name: 'confirmation_schedule_id',
        type: '@sys.text',
        value: schedule.scheduleId,
      },
      {
        name: 'confirmation_group_id',
        type: '@sys.text',
        value: groupId,
      },
      {
        name: 'confirmation_group_description',
        type: '@sys.text',
        value: groupDescription,
      },
      {
        name: 'confirmation_group_description_prefix',
        type: '@sys.text',
        value: groupDescriptionPrefix,
      },
      {
        name: 'confirmation_group_code_list',
        type: '@sys.text',
        value: groupCodeList,
      },
      {
        name: 'confirmation_group_id_list',
        type: '@sys.text',
        value: groupIdList,
      },
      {
        name: 'confirmation_external_id',
        type: '@sys.text',
        value: schedule.externalId,
      },
      ...scheduleDataAttributes,
    ];

    // filtrar atributos que não possuem value
    const sanitizedAttributes = attributes.filter((attr) => {
      if (!attr.value || attr.value === 'undefined') {
        return false;
      }

      return !!attr;
    });

    switch (sendType) {
      case ExtractResumeType.reminder:
      case ExtractResumeType.confirmation: {
        return sanitizedAttributes;
      }
      case ExtractResumeType.schedule_notification:
      case ExtractResumeType.medical_report:
      case ExtractResumeType.documents_request:
      case ExtractResumeType.active_mkt:
      case ExtractResumeType.nps: {
        if (templateId) {
          // templateVariableAttributeKeys contém a key(name) dos atributos que estão como variaveis no template ou null se o template não existir
          const templateVariableAttributeKeys =
            await this.externalDataService.getTemplateVariableKeys(
              templateId,
              sanitizedAttributes.map((attr) => ({
                key: attr.name,
                value: attr.value,
              })),
            );

          if (!!templateVariableAttributeKeys) {
            // retorna apenas os atributos que estão como variaveis do template que será enviado
            return sanitizedAttributes.filter(
              (attribute) =>
                !!templateVariableAttributeKeys.includes(attribute.name),
            );
          }
        }
        return sanitizedAttributes;
      }
      default: {
        return sanitizedAttributes;
      }
    }
  }

  async buildScheduleDataAtttibutes(schedule: Schedule): Promise<
    Array<{
      name: string;
      type: string;
      value: string;
    }>
  > {
    try {
      if (schedule?.data && typeof schedule?.data == 'object') {
        return Object.keys(schedule.data).map((key) => {
          return {
            name: key?.toLowerCase?.(),
            type: '@sys.text',
            value: schedule.data[key],
          };
        });
      }
    } catch (e) {
      Sentry.captureEvent({
        message: 'SendScheduleMessageService.buildScheduleDataAtttibutes',
        extra: {
          error: e,
          schedule,
        },
      });
    }
    return [];
  }

  buildEmailMessageByType(
    data: SendScheduleMessageData,
    emailType: any /*EmailType*/,
    templateData: Record<string, string>,
    templateVersion: any,
  ): Partial<any /*EmailCreatedMessage*/> {
    const { schedule, scheduleMessage, action } = data;

    if (emailType !== 'invite' /*EmailType.invite*/) {
      return { type: emailType };
    }

    const {
      appointmentTypeName,
      organizationUnitAddress,
      organizationUnitName,
      scheduleCode,
      scheduleId,
      scheduleDate,
      doctorName,
      patientName,
      procedureName,
    } = schedule;

    let html;
    let text;
    let fromTitle;
    let subject;

    const text_doctorName = doctorName ? `com ${doctorName}` : '';
    const text_organizationUnitName = organizationUnitName
      ? `em ${organizationUnitName}`
      : '';

    const content = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//${organizationUnitName}//${action}//PT
METHOD:REQUEST
BEGIN:VEVENT
UID:${scheduleId || scheduleCode}@atend.clinic
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${moment(scheduleDate).utc().format('YYYYMMDDTHHmmss')}
DTEND:${moment(scheduleDate).utc().add(1, 'h').format('YYYYMMDDTHHmmss')}
SUMMARY:${
      appointmentTypeName
        ? `${appointmentTypeName} ${text_doctorName} ${text_organizationUnitName}`
        : organizationUnitName || ''
    }
DESCRIPTION:${
      appointmentTypeName
        ? `${appointmentTypeName} ${text_doctorName} - ${moment(scheduleDate).format('DD/MM [às] HH:mm')}.`
        : ''
    }
LOCATION:${organizationUnitAddress || organizationUnitName || ''}
ORGANIZER;CN=${organizationUnitName}:mailto:confirmacao@atend.clinic
ATTENDEE;CN=${patientName};RSVP=TRUE:mailto:${scheduleMessage.recipient}
CONTACT;CN=${organizationUnitName}:
BEGIN:VALARM
TRIGGER:-PT24H
ACTION:DISPLAY
DESCRIPTION:Lembrete: Você tem um(a) ${appointmentTypeName} médica amanhã às ${moment(scheduleDate).format('HH:mm')}.
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Lembrete: Você tem um(a) ${appointmentTypeName} médica em 1 hora.
END:VALARM
END:VEVENT
END:VCALENDAR
`;
    html = this.buildTemplateHtmlWithVariables(
      templateVersion?.html_content ||
        '<p>Você tem um convite na sua agenda!</p>',
      templateData,
    );
    text = `${
      appointmentTypeName
        ? `Convite para ${appointmentTypeName} ${text_organizationUnitName}`
        : `Convite para seu comparecimento ${text_organizationUnitName}`
    }`;
    fromTitle = organizationUnitName;
    subject = `${appointmentTypeName} ${procedureName || ''}`;

    return {
      fromTitle: fromTitle,
      subject: subject,
      content: content,
      type: emailType,
      html,
      text,
    };
  }

  buildTemplateHtmlWithVariables(
    htmlContent: string,
    templateData: Record<string, string>,
  ) {
    return htmlContent.replace(/{{(.*?)}}/g, (match, key) => {
      // Remover espaços em branco extras do 'key' e verificar no templateData
      const trimmedKey = key.trim();
      return templateData[trimmedKey] || ''; // Substitui pelo valor ou vazio se não existir
    });
  }

  async sendEvent(data) {
    await this.eventsService.sendEvent({
      data,
      dataType: KissbotEventDataType.ANY,
      source: KissbotEventSource.KISSBOT_API,
      type: KissbotEventType.SEND_MESSAGE,
    });
  }

  async sendEmailEvent(workspaceId: string, data: any /*EmailCreatedMessage*/) {
    await this.kafkaService.sendEvent(
      data,
      workspaceId,
      KissbotEventType.EMAIL_CREATED,
    );
  }
}
