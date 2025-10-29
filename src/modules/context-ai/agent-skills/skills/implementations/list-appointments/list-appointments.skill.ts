import { Injectable, Logger } from '@nestjs/common';
import { Skill, SkillExamples } from '../../core/interfaces';
import { SkillEnum } from '..';
import { IAgent } from '../../../../agent/interfaces/agent.interface';
import { DataExtractionUtil } from '../../../../data-extractors/data-extraction.util';
import { AiProviderService } from '../../../../ai-provider/ai.service';
import { Appointment } from './list-appointments.interfaces';
import { SkillResult } from '../../interfaces/skill-result.interface';
import { SkillSession, SkillSessionStatus, AppointmentAction } from '../../interfaces/skill-session.interface';
import { SkillSessionService } from '../../services/skill-session.service';
import { ListAppointmentsApi } from './list-appointments.api';
import { ListAppointmentsPrompts, ConfirmationIntent } from './list-appointments.prompts';
import { ListAppointmentsMessages } from './list-appointments.messages';
import { ListAppointmentsCacheService } from './list-appointments-cache.service';

@Injectable()
export class ListAppointmentsSkill implements Skill {
    name = SkillEnum.listAppointments;
    description =
        'Consulta e exibe os horários já agendados pelo paciente. Use quando o paciente quiser ver seus próprios agendamentos existentes, consultar horários marcados, verificar suas consultas já confirmadas, ou quando mencionar cancelamento, confirmação ou reagendamento de consultas existentes. NÃO use para agendar novos horários.';
    examples: SkillExamples = {
        positive: [
            'Quero ver meus horários',
            'Tenho consulta marcada?',
            'Preciso conferir minha agenda',
            'Qual meu próximo agendamento?',
            'Quando tenho consulta?',
            'Me mostra minhas consultas marcadas',
            'Esqueci quando é minha consulta',
            'Preciso saber meus horários confirmados',
            'Quero cancelar minha consulta',
            'Preciso confirmar meu agendamento',
            'Quero desmarcar meu agendamento',
        ],
        negative: [
            'Quero agendar uma consulta',
            'Preciso marcar horário',
            'Tem vaga para amanhã?',
            'Como faço para agendar?',
        ],
    };
    private readonly logger = new Logger(ListAppointmentsSkill.name);

    constructor(
        private readonly aiProviderService: AiProviderService,
        private readonly listAppointmentsApi: ListAppointmentsApi,
        private readonly skillSessionService: SkillSessionService,
        private readonly cacheService: ListAppointmentsCacheService,
        private readonly dataExtractor: DataExtractionUtil,
    ) {}

    validator(agent: IAgent) {
        if (!agent.integrationId) {
            throw new Error('Required integration to execute Skill');
        }
    }

    private async fetchAndStoreAppointments(
        agent: IAgent,
        cpf: string,
        birthDate: string,
        sessionId: string,
        initialMessage?: string,
    ): Promise<SkillResult> {
        try {
            const [appointments, intentDetection] = await Promise.all([
                this.listAppointmentsApi.fetchPatientAppointments(agent, cpf, birthDate),
                initialMessage
                    ? ListAppointmentsPrompts.detectInitialIntent(this.aiProviderService, initialMessage)
                    : Promise.resolve({ hasIntent: false, confidence: 0, action: undefined, target: undefined }),
            ]);

            await Promise.all([
                this.cacheService.cachePatientData(sessionId, {
                    cpf,
                    birthDate,
                }),
                this.cacheService.cacheAppointments(sessionId, appointments),
            ]);

            await this.skillSessionService.updateCollectedData(sessionId, {
                appointments,
                initialMessage: undefined,
            });
            await this.skillSessionService.updateSession(sessionId, { status: SkillSessionStatus.WAITING_FOR_ACTION });

            const message = ListAppointmentsMessages.getAppointmentsListMessage(appointments, intentDetection);

            return {
                appointments,
                message,
                isComplete: false,
                requiresInput: true,
            };
        } catch (error) {
            this.logger.error('Error fetching appointments:', error);
            await this.skillSessionService.clearSession(sessionId);
            return {
                message: ListAppointmentsMessages.getErrorFetchingAppointments(),
                isComplete: true,
            };
        }
    }

    async execute(agent: IAgent, args?: Record<string, any>): Promise<SkillResult> {
        try {
            this.validator(agent);

            const sessionId = this.getSessionId(args);
            const userMessage = args?.message || '';

            let activeSession = await this.skillSessionService.getActiveSession(sessionId);

            if (!activeSession) {
                const cachedPatientData = await this.cacheService.getCachedPatientData(sessionId);
                if (cachedPatientData) {
                    const cachedAppointments = await this.cacheService.getCachedAppointments(sessionId);
                    if (cachedAppointments) {
                        await this.skillSessionService.createSession(
                            sessionId,
                            this.name,
                            SkillSessionStatus.WAITING_FOR_ACTION,
                        );
                        await this.skillSessionService.updateCollectedData(sessionId, {
                            appointments: cachedAppointments,
                        });

                        const intentDetection = userMessage
                            ? await ListAppointmentsPrompts.detectInitialIntent(this.aiProviderService, userMessage)
                            : { hasIntent: false, confidence: 0, action: undefined, target: undefined };

                        const message = ListAppointmentsMessages.getAppointmentsListMessage(
                            cachedAppointments,
                            intentDetection,
                        );

                        return {
                            appointments: cachedAppointments,
                            message,
                            isComplete: false,
                            requiresInput: true,
                        };
                    }

                    await this.skillSessionService.createSession(
                        sessionId,
                        this.name,
                        SkillSessionStatus.WAITING_FOR_CPF,
                    );
                    return await this.fetchAndStoreAppointments(
                        agent,
                        cachedPatientData.cpf,
                        cachedPatientData.birthDate,
                        sessionId,
                        userMessage,
                    );
                }

                activeSession = await this.skillSessionService.createSession(
                    sessionId,
                    this.name,
                    SkillSessionStatus.WAITING_FOR_CPF,
                );

                await this.skillSessionService.updateCollectedData(sessionId, { initialMessage: userMessage });

                const cpfResult = await this.dataExtractor.extractCpf(userMessage, args?.isAudio);
                const birthDateResult = await this.dataExtractor.extractBirthDate(userMessage, args?.isAudio);

                if (cpfResult.extracted && birthDateResult.extracted) {
                    return await this.fetchAndStoreAppointments(
                        agent,
                        cpfResult.value,
                        birthDateResult.value,
                        sessionId,
                        userMessage,
                    );
                } else if (cpfResult.extracted) {
                    await this.skillSessionService.updateCollectedData(sessionId, { cpf: cpfResult.value });
                    await this.skillSessionService.updateSession(sessionId, {
                        status: SkillSessionStatus.WAITING_FOR_BIRTH_DATE,
                    });

                    return {
                        message: ListAppointmentsMessages.getRandomBirthDateMessage(),
                        isComplete: false,
                        requiresInput: true,
                    };
                } else if (birthDateResult.extracted) {
                    await this.skillSessionService.updateCollectedData(sessionId, { birthDate: birthDateResult.value });

                    return {
                        message: ListAppointmentsMessages.getRandomCpfMessage(),
                        isComplete: false,
                        requiresInput: true,
                    };
                }
            }

            switch (activeSession.status) {
                case SkillSessionStatus.WAITING_FOR_CPF:
                    return await this.handleCpfInput(sessionId, userMessage, activeSession, args, agent);

                case SkillSessionStatus.WAITING_FOR_BIRTH_DATE:
                    return await this.handleBirthDateInput(sessionId, userMessage, activeSession, args, agent);

                case SkillSessionStatus.WAITING_FOR_ACTION:
                    return await this.handleActionInput(sessionId, userMessage, activeSession);

                case SkillSessionStatus.CONFIRMING_CANCEL:
                case SkillSessionStatus.CONFIRMING_CONFIRM:
                case SkillSessionStatus.CONFIRMING_MULTIPLE:
                    return await this.handleConfirmationInput(sessionId, userMessage, activeSession, agent);

                default:
                    await this.skillSessionService.createSession(
                        sessionId,
                        this.name,
                        SkillSessionStatus.WAITING_FOR_CPF,
                    );
                    return {
                        message: ListAppointmentsMessages.getRandomCpfMessage(),
                        isComplete: false,
                        requiresInput: true,
                    };
            }
        } catch (error) {
            this.logger.error('Error in execute method:', error);
            const sessionId = this.getSessionId(args);
            await this.skillSessionService.clearSession(sessionId);
            return {
                message: ListAppointmentsMessages.getErrorProcessingAction(),
                isComplete: true,
            };
        }
    }

    private async handleCpfInput(
        sessionId: string,
        userMessage: string,
        activeSession: SkillSession,
        args?: Record<string, any>,
        agent?: IAgent,
    ): Promise<SkillResult> {
        const cpfResult = await this.dataExtractor.extractCpf(userMessage, args?.isAudio);
        const birthDateResult = await this.dataExtractor.extractBirthDate(userMessage, args?.isAudio);

        if (cpfResult.extracted) {
            if (birthDateResult.extracted) {
                const initialMessage = activeSession.collectedData.initialMessage || userMessage;
                return await this.fetchAndStoreAppointments(
                    agent,
                    cpfResult.value,
                    birthDateResult.value,
                    sessionId,
                    initialMessage,
                );
            } else {
                await this.skillSessionService.updateCollectedData(sessionId, { cpf: cpfResult.value });
                await this.skillSessionService.updateSession(sessionId, {
                    status: SkillSessionStatus.WAITING_FOR_BIRTH_DATE,
                });

                return {
                    message: ListAppointmentsMessages.getRandomBirthDateMessage(),
                    isComplete: false,
                    requiresInput: true,
                };
            }
        } else {
            const newRetryCount = activeSession.currentRetries + 1;

            if (newRetryCount >= activeSession.maxRetries) {
                await this.skillSessionService.clearSession(sessionId);
                return {
                    message: ListAppointmentsMessages.getErrorCpfNotIdentified(),
                    isComplete: true,
                };
            }

            await this.skillSessionService.updateSession(sessionId, { currentRetries: newRetryCount });

            return {
                message: ListAppointmentsMessages.getRandomCpfMessage(),
                isComplete: false,
                requiresInput: true,
            };
        }
    }

    private async handleBirthDateInput(
        sessionId: string,
        userMessage: string,
        activeSession: SkillSession,
        args: Record<string, any>,
        agent: IAgent,
    ): Promise<SkillResult> {
        const birthDateResult = await this.dataExtractor.extractBirthDate(userMessage, args?.isAudio);
        const cpfResult = await this.dataExtractor.extractCpf(userMessage, args?.isAudio);

        const cpf = cpfResult.extracted ? cpfResult.value : activeSession.collectedData.cpf;
        const birthDate = birthDateResult.extracted ? birthDateResult.value : activeSession.collectedData.birthDate;

        if (cpf && birthDate) {
            const initialMessage = activeSession.collectedData.initialMessage || userMessage;
            return await this.fetchAndStoreAppointments(agent, cpf, birthDate, sessionId, initialMessage);
        } else if (!birthDate) {
            const newRetryCount = activeSession.currentRetries + 1;

            if (newRetryCount >= activeSession.maxRetries) {
                await this.skillSessionService.clearSession(sessionId);
                return {
                    message: ListAppointmentsMessages.getErrorBirthDateNotIdentified(),
                    isComplete: true,
                };
            }

            await this.skillSessionService.updateSession(sessionId, { currentRetries: newRetryCount });

            return {
                message: ListAppointmentsMessages.getRandomBirthDateMessage(),
                isComplete: false,
                requiresInput: true,
            };
        } else {
            await this.skillSessionService.updateCollectedData(sessionId, { birthDate });
            await this.skillSessionService.updateSession(sessionId, { status: SkillSessionStatus.WAITING_FOR_CPF });

            return {
                message: ListAppointmentsMessages.getRandomCpfMessage(),
                isComplete: false,
                requiresInput: true,
            };
        }
    }

    private async handleActionInput(
        sessionId: string,
        userMessage: string,
        activeSession: SkillSession,
    ): Promise<SkillResult> {
        const appointments = activeSession.collectedData.appointments as Appointment[];

        if (!appointments || appointments.length === 0) {
            await this.skillSessionService.clearSession(sessionId);
            return {
                message: ListAppointmentsMessages.getErrorNoAppointments(),
                isComplete: true,
            };
        }

        const result = await this.parseActionCommand(userMessage, appointments);

        if (result.actions.length === 0) {
            return {
                message: ListAppointmentsMessages.getActionNotUnderstood(),
                isComplete: false,
                requiresInput: true,
            };
        }

        if (result.actions.length > 1) {
            return await this.showMultipleActionsConfirmation(sessionId, appointments, result.actions);
        }

        const singleAction = result.actions[0];
        return await this.showActionConfirmation(sessionId, appointments, singleAction.action, singleAction.indices);
    }

    private async showMultipleActionsConfirmation(
        sessionId: string,
        appointments: Appointment[],
        actions: Array<{
            action: AppointmentAction.CANCEL | AppointmentAction.CONFIRM;
            indices: number[];
            confidence: number;
        }>,
    ): Promise<SkillResult> {
        const sections: string[] = [];

        for (const actionItem of actions) {
            const targetAppointments = actionItem.indices
                .map((i) => appointments[i - 1])
                .filter((apt) => apt !== undefined);

            if (targetAppointments.length === 0) continue;

            const appointmentsList = ListAppointmentsMessages.formatAppointmentsList(
                targetAppointments,
                actionItem.indices,
            );

            const actionText =
                actionItem.action === AppointmentAction.CANCEL
                    ? ListAppointmentsMessages.getCancelActionText(targetAppointments.length > 1)
                    : ListAppointmentsMessages.getConfirmActionText(targetAppointments.length > 1);

            sections.push(`${actionText}:\n${appointmentsList}`);
        }

        if (sections.length === 0) {
            return {
                message: ListAppointmentsMessages.getErrorAppointmentsNotFound(),
                isComplete: false,
                requiresInput: true,
            };
        }

        const confirmationMessage = ListAppointmentsMessages.getMultipleActionsConfirmationMessage(sections);

        await this.skillSessionService.updateCollectedData(sessionId, {
            pendingActions: actions,
        });
        await this.skillSessionService.updateSession(sessionId, { status: SkillSessionStatus.CONFIRMING_MULTIPLE });

        return {
            message: confirmationMessage,
            isComplete: false,
            requiresInput: true,
            suggestedActions: ListAppointmentsMessages.getConfirmationActions(),
        };
    }

    private async showActionConfirmation(
        sessionId: string,
        appointments: Appointment[],
        action: AppointmentAction.CANCEL | AppointmentAction.CONFIRM,
        indices: number[],
    ): Promise<SkillResult> {
        const targetAppointments = indices.map((i) => appointments[i - 1]).filter((apt) => apt !== undefined);

        if (targetAppointments.length === 0) {
            return {
                message: ListAppointmentsMessages.getErrorAppointmentsNotFound(),
                isComplete: false,
                requiresInput: true,
            };
        }

        const appointmentsList = ListAppointmentsMessages.formatAppointmentsList(targetAppointments, indices);

        const plural = targetAppointments.length > 1;

        let confirmationMessage: string;
        let newStatus: SkillSessionStatus.CONFIRMING_CANCEL | SkillSessionStatus.CONFIRMING_CONFIRM;

        switch (action) {
            case AppointmentAction.CANCEL:
                newStatus = SkillSessionStatus.CONFIRMING_CANCEL;
                confirmationMessage = ListAppointmentsMessages.getCancelConfirmationMessage(appointmentsList, plural);
                break;

            case AppointmentAction.CONFIRM:
                newStatus = SkillSessionStatus.CONFIRMING_CONFIRM;
                confirmationMessage = ListAppointmentsMessages.getConfirmConfirmationMessage(appointmentsList, plural);
                break;

            default:
                return {
                    message: ListAppointmentsMessages.getErrorCannotProcessAction(),
                    isComplete: true,
                };
        }

        await this.skillSessionService.updateCollectedData(sessionId, {
            pendingAction: {
                action,
                indices,
            },
        });
        await this.skillSessionService.updateSession(sessionId, { status: newStatus });

        return {
            message: confirmationMessage,
            isComplete: false,
            requiresInput: true,
            suggestedActions: ListAppointmentsMessages.getConfirmationActions(),
        };
    }

    private async parseConfirmationResponse(userMessage: string): Promise<{
        intent: ConfirmationIntent;
        confidence: number;
    }> {
        return await ListAppointmentsPrompts.parseConfirmationResponse(this.aiProviderService, userMessage);
    }

    private async handleConfirmationInput(
        sessionId: string,
        userMessage: string,
        activeSession: SkillSession,
        agent: IAgent,
    ): Promise<SkillResult> {
        const appointments = activeSession.collectedData.appointments as Appointment[];
        const pendingAction = activeSession.collectedData.pendingAction;
        const pendingActions = activeSession.collectedData.pendingActions;

        if ((!pendingAction && !pendingActions) || !appointments) {
            await this.skillSessionService.clearSession(sessionId);
            return {
                message: ListAppointmentsMessages.getGenericError(),
                isComplete: true,
            };
        }

        const classification = await this.parseConfirmationResponse(userMessage);

        if (classification.intent === ConfirmationIntent.UNCLEAR || classification.confidence < 0.6) {
            return {
                message: ListAppointmentsMessages.getClarifyConfirmation(),
                isComplete: false,
                requiresInput: true,
            };
        }

        if (classification.intent === ConfirmationIntent.DENY) {
            await this.skillSessionService.updateCollectedData(sessionId, {
                pendingAction: undefined,
                pendingActions: undefined,
            });
            await this.skillSessionService.updateSession(sessionId, { status: SkillSessionStatus.WAITING_FOR_ACTION });

            return {
                message: ListAppointmentsMessages.getOperationCancelled(),
                isComplete: false,
                requiresInput: true,
            };
        }

        if (pendingActions && pendingActions.length > 0) {
            return await this.executeMultipleActions(sessionId, appointments, pendingActions);
        }

        if (pendingAction) {
            switch (pendingAction.action) {
                case AppointmentAction.CANCEL:
                    return await this.executeCancelAppointments(sessionId, appointments, pendingAction.indices);

                case AppointmentAction.CONFIRM:
                    return await this.executeConfirmAppointments(sessionId, appointments, pendingAction.indices);

                default:
                    await this.skillSessionService.clearSession(sessionId);
                    return {
                        message: ListAppointmentsMessages.getErrorCannotProcessAction(),
                        isComplete: true,
                    };
            }
        }

        await this.skillSessionService.clearSession(sessionId);
        return {
            message: ListAppointmentsMessages.getGenericError(),
            isComplete: true,
        };
    }

    private async executeMultipleActions(
        sessionId: string,
        appointments: Appointment[],
        actions: Array<{
            action: AppointmentAction.CANCEL | AppointmentAction.CONFIRM;
            indices: number[];
            confidence: number;
        }>,
    ): Promise<SkillResult> {
        try {
            let cancelCount = 0;
            let confirmCount = 0;

            for (const actionItem of actions) {
                const targetAppointments = actionItem.indices
                    .map((i) => appointments[i - 1])
                    .filter((apt) => apt !== undefined);

                if (targetAppointments.length === 0) continue;

                if (actionItem.action === AppointmentAction.CANCEL) {
                    cancelCount += targetAppointments.length;
                } else {
                    confirmCount += targetAppointments.length;
                }
            }

            await this.skillSessionService.clearSession(sessionId);

            return {
                message: ListAppointmentsMessages.getMultipleActionsExecuted(),
                isComplete: true,
                suggestedActions: ListAppointmentsMessages.getSuggestedActions(),
            };
        } catch (error) {
            this.logger.error('Error executing multiple actions:', error);
            await this.skillSessionService.clearSession(sessionId);
            return {
                message: ListAppointmentsMessages.getErrorExecutingMultipleActions(),
                isComplete: true,
            };
        }
    }

    private async executeCancelAppointments(
        sessionId: string,
        appointments: Appointment[],
        indices: number[],
    ): Promise<SkillResult> {
        try {
            const targetAppointments = indices.map((i) => appointments[i - 1]).filter((apt) => apt !== undefined);

            if (targetAppointments.length === 0) {
                return {
                    message: ListAppointmentsMessages.getErrorAppointmentsNotFound(),
                    isComplete: false,
                    requiresInput: true,
                };
            }

            await this.skillSessionService.clearSession(sessionId);

            return {
                message: ListAppointmentsMessages.getAppointmentsCancelled(targetAppointments.length),
                isComplete: true,
                suggestedActions: ListAppointmentsMessages.getSuggestedActions(),
            };
        } catch (error) {
            this.logger.error('Error canceling appointments:', error);
            await this.skillSessionService.clearSession(sessionId);
            return {
                message: ListAppointmentsMessages.getErrorCancelingAppointments(),
                isComplete: true,
            };
        }
    }

    private async executeConfirmAppointments(
        sessionId: string,
        appointments: Appointment[],
        indices: number[],
    ): Promise<SkillResult> {
        try {
            const targetAppointments = indices.map((i) => appointments[i - 1]).filter((apt) => apt !== undefined);

            if (targetAppointments.length === 0) {
                return {
                    message: ListAppointmentsMessages.getErrorAppointmentsNotFound(),
                    isComplete: false,
                    requiresInput: true,
                };
            }

            await this.skillSessionService.clearSession(sessionId);

            return {
                message: ListAppointmentsMessages.getAppointmentsConfirmed(targetAppointments.length),
                isComplete: true,
                suggestedActions: ListAppointmentsMessages.getSuggestedActions(),
            };
        } catch (error) {
            this.logger.error('Error confirming appointments:', error);
            await this.skillSessionService.clearSession(sessionId);
            return {
                message: ListAppointmentsMessages.getErrorConfirmingAppointments(),
                isComplete: true,
            };
        }
    }

    private async parseActionCommand(
        userMessage: string,
        appointments: Appointment[],
    ): Promise<{
        actions: Array<{
            action: AppointmentAction.CANCEL | AppointmentAction.CONFIRM;
            indices: number[];
            confidence: number;
        }>;
    }> {
        return await ListAppointmentsPrompts.parseActionCommand(this.aiProviderService, userMessage, appointments);
    }

    private getSessionId(args?: Record<string, any>): string {
        return args?.contextId || args?.sessionId || 'default';
    }

    generatePrompt(data: SkillResult, _userMessage?: string, _conversationHistory?: any[]): string {
        return data.message;
    }
}
