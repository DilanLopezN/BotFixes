import * as Sentry from '@sentry/node';
import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  DeleteCommand,
  UpdateCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { SapUserNotification } from '../sap.interface';
import * as moment from 'moment';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

@Injectable()
export class SapDynamoDB {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;
  private readonly region: string;

  constructor() {
    this.tableName = process.env.NODE_ENV === 'local' ? 'local-sap-2' : 'sap-caledonia-production';
    this.region = 'sa-east-1';

    const client = new DynamoDBClient({
      region: this.region,
      credentials: fromNodeProviderChain({
        clientConfig: { region: this.region },
      }),
    });

    this.docClient = DynamoDBDocumentClient.from(client);
  }

  async addItem(item: SapUserNotification): Promise<{ ok: boolean }> {
    try {
      const { id, userPhoneNumber, contractNumber } = item;
      const command = new PutCommand({
        TableName: this.tableName,
        Item: {
          id,
          userPhoneNumber,
          contractNumber,
          notificationDate: moment().format('DD/MM/YYYY'),
          warningBalance: false,
          warningExpiration: false,
        },
      });

      await this.docClient.send(command);
      return { ok: true };
    } catch (error) {
      Sentry.captureEvent({
        message: 'ERROR-SAP:addItem',
        extra: { error },
      });

      return { ok: false };
    }
  }

  async getAllItems(): Promise<SapUserNotification[]> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
      });

      const result = await this.docClient.send(command);
      return (result.Items ?? []) as SapUserNotification[];
    } catch (error) {
      console.error(error);
      Sentry.captureEvent({
        message: 'ERROR-SAP:getAllItems',
        extra: { error },
      });

      return [];
    }
  }

  async getItem(id: string): Promise<Record<string, any>> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { id },
      });

      const item = await this.docClient.send(command);
      return item.Item;
    } catch (error) {
      Sentry.captureEvent({
        message: 'ERROR-SAP:getItem',
        extra: { error },
      });
    }
  }

  async removeItem(id: string): Promise<{ ok: boolean }> {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
      });

      await this.docClient.send(command);
      return { ok: true };
    } catch (error) {
      Sentry.captureEvent({
        message: 'ERROR-SAP:removeItem',
        extra: { error },
      });
    }
  }

  async updateItem(id: string, updateValue: { key: string; value: any }): Promise<{ ok: boolean }> {
    try {
      const { key, value } = updateValue;
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: `set ${key} = :${key}`,
        ExpressionAttributeValues: {
          [':' + key]: value,
        },
        ReturnValues: 'UPDATED_NEW',
      });

      await this.docClient.send(command);
      return { ok: true };
    } catch (error) {
      console.error('Error updating item:', error);
      Sentry.captureEvent({
        message: 'ERROR-SAP:updateItem',
        extra: { error },
      });
      return { ok: false };
    }
  }
}
