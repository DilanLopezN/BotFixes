import { Injectable } from '@nestjs/common';
import { BaseProcessor } from './base-processor';
import { ProcessingContext, ProcessingResult } from '../interfaces/conversation-processor.interface';
import { SmallTalkService } from '../../small-talk/small-talk.service';
import { SkillSessionService } from '../../agent-skills/skills/services/skill-session.service';

@Injectable()
export class SmallTalkProcessor extends BaseProcessor {
    constructor(
        private readonly smallTalkService: SmallTalkService,
        private readonly skillSessionService: SkillSessionService,
    ) {
        super(SmallTalkProcessor.name);
    }

    async canHandle(context: ProcessingContext): Promise<boolean> {
        try {
            const activeSession = await this.skillSessionService.getActiveSession(context.contextId);
            if (activeSession) {
                this.logger.log(
                    `[SmallTalkProcessor] Active session found (${activeSession.skillName}), skipping small talk check`,
                );
                return false;
            }

            const smallTalkResponse = await this.smallTalkService.interceptSmallTalk({
                agent: context.agent,
                userMessage: context.message,
                customVariables: context.parameters,
                contextId: context.contextId,
            });
            return !!smallTalkResponse;
        } catch (error) {
            this.logError(context, 'Erro ao verificar small talk', error);
            return false;
        }
    }

    async process(context: ProcessingContext): Promise<ProcessingResult> {
        try {
            const smallTalkResponse = await this.smallTalkService.interceptSmallTalk({
                agent: context.agent,
                userMessage: context.message,
                customVariables: context.parameters,
                contextId: context.contextId,
            });

            if (smallTalkResponse) {
                const shouldGenerateAudio = this.shouldGenerateAudio(context);

                return this.createStopResultWithAudio(smallTalkResponse, shouldGenerateAudio, {
                    processorType: 'small-talk',
                    intercepted: true,
                });
            }

            return this.createContinueResult();
        } catch (error) {
            this.logError(context, 'Erro no processamento de small talk', error);
            return this.createContinueResult();
        }
    }
}
