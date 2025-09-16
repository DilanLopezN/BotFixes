import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as Sentry from '@sentry/node';
@Injectable()
export class ExternalDataService {
  async getConversationIdByScheduleMessageUuidList(
    uuidList: string[],
    workspaceId: string,
  ): Promise<{ [key: string]: string }> {
    const requestData = {
      uuidList,
      workspaceId,
    };
    try {
      const url =
        process.env.INTERNAL_API_URL +
        `/internal/automatic-message/getConversationIdByScheduleMessageUuidList`;
      const response = await axios.post(url, requestData);
      return response.data;
    } catch (error) {
      Sentry.captureEvent({
        message: `${ExternalDataService.name}.getConversationIdByScheduleMessageUuidList`,
        extra: {
          error,
        },
      });
      throw error;
    }
  }

  async getConversationById(conversationId: string): Promise<any> {
    try {
      const url = process.env.INTERNAL_API_URL + `/internal/automatic-message/getConversationById`;
      const response = await axios.post(url, { conversationId });
      return response.data;
    } catch (error) {
      Sentry.captureEvent({
        message: `${ExternalDataService.name}.getConversationById`,
        extra: {
          error,
        },
      });
      throw error;
    }
  }

  async dispatchMessageActivity(conversation, activity) {
    try {
      const url = process.env.INTERNAL_API_URL + `/internal/automatic-message/dispatchMessageActivity`;
      const response = await axios.post(url, { conversation, activity });
      return response.data;
    } catch (error) {
      Sentry.captureEvent({
        message: `${ExternalDataService.name}.dispatchMessageActivity`,
        extra: {
          error,
        },
      });
      throw error;
    }
  }

  async getTemplateById(templateId: string) {
    try {
      const url = process.env.INTERNAL_API_URL + `/internal/automatic-message/getTemplateById`;
      const response = await axios.post(url, { templateId });
      return response.data;
    } catch (error) {
      Sentry.captureEvent({
        message: `${ExternalDataService.name}.getTemplateById`,
        extra: {
          error,
        },
      });
      throw error;
    }
  }

  async getParsedTemplate(
    templateId: string,
    values: { key: string; value: string }[],
  ) {
    try {
      const url = process.env.INTERNAL_API_URL + `/internal/automatic-message/getParsedTemplate`;
      const response = await axios.post(url, { templateId, values });
      return response.data;
    } catch (error) {
      Sentry.captureEvent({
        message: `${ExternalDataService.name}.getParsedTemplate`,
        extra: {
          error,
        },
      });
      throw error;
    }
  }

  async getTemplateVariableKeys(
    templateId: string,
    values: { key: string; value: string }[],
  ) {
    try {
      const url = process.env.INTERNAL_API_URL + `/internal/automatic-message/getTemplateVariableKeys`;
      const response = await axios.post(url, { templateId, values });
      return response.data;
    } catch (error) {
      Sentry.captureEvent({
        message: `${ExternalDataService.name}.getTemplateVariableKeys`,
        extra: {
          error,
        },
      });
      throw error;
    }
  }

  async getEmailSendingSettingByWorkspaceIdAndId(
    workspaceId: string,
    emailSendingSettingId: number,
  ) {
    try {
      const url = process.env.INTERNAL_API_URL + `/internal/automatic-message/getEmailSendingSettingByWorkspaceIdAndId`;
      const response = await axios.post(url, { workspaceId, emailSendingSettingId });
      return response.data;
    } catch (error) {
      Sentry.captureEvent({
        message: `${ExternalDataService.name}.getEmailSendingSettingByWorkspaceIdAndId`,
        extra: {
          error,
        },
      });
      throw error;
    }
  }

  async getEmailTemplateVariableKeys(templateId: string, versionId: string) {
    try {
      const url = process.env.INTERNAL_API_URL + `/internal/automatic-message/getEmailTemplateVariableKeys`;
      const response = await axios.post(url, { templateId, versionId });
      return response.data;
    } catch (error) {
      Sentry.captureEvent({
        message: `${ExternalDataService.name}.getEmailTemplateVariableKeys`,
        extra: {
          error,
        },
      });
      throw error;
    }
  }

  async getEmailTemplateByVersion(templateId: string, versionId: string) {
    try {
      const url = process.env.INTERNAL_API_URL + `/internal/automatic-message/getEmailTemplateByVersion`;
      const response = await axios.post(url, { templateId, versionId });
      return response.data;
    } catch (error) {
      Sentry.captureEvent({
        message: `${ExternalDataService.name}.getEmailTemplateByVersion`,
        extra: {
          error,
        },
      });
      throw error;
    }
  }
}
