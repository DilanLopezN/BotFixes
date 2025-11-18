import { Injectable } from '@nestjs/common';
import * as contextService from 'request-context';

@Injectable()
export class SentryErrorHandlerService {
  public defaultApiIntegrationError(payload: any, response: any, metadata: any) {
    if (!metadata) {
      metadata = contextService.get('req:default-headers');
    }

    const data = {
      user: {
        id: metadata?.memberId,
        username: metadata?.conversationId,
      },
      extra: {
        payload: JSON.stringify(payload),
        error: response?.data?.[0]?.error || response?.data?.error || response?.data || response,
        metadata: {
          cvId: metadata?.conversationId,
          wsId: metadata?.workspaceId,
          mbId: metadata?.memberId,
          ...(metadata?.conversationId
            ? {
                cUrl: `https://app.botdesigner.io/live-agent?workspace=${metadata?.workspaceId}&conversation=${metadata?.conversationId}`,
              }
            : {}),
        },
      },
    };

    return data;
  }
}
