import { Injectable } from '@nestjs/common';
import { SuggestedAction, ActionKey } from '../interfaces/conversational-agent.interface';

@Injectable()
export class SuggestedActionsService {
    private readonly actionMappings: Record<ActionKey, SuggestedAction> = {
        [ActionKey.HANDOFF]: {
            label: 'Falar com atendente',
            value: 'falar com atendente',
            type: ActionKey.HANDOFF,
        },
        [ActionKey.MESSAGE]: {
            label: 'Mensagem',
            value: 'mensagem',
            type: ActionKey.MESSAGE,
        },
        [ActionKey.END]: {
            label: 'Encerrar',
            value: 'encerrar',
            type: ActionKey.END,
        },
        [ActionKey.CONTINUE]: {
            label: 'Continuar',
            value: 'continuar',
            type: ActionKey.CONTINUE,
        },
        [ActionKey.RESCHEDULE]: {
            label: 'Reagendar',
            value: 'reagendar',
            type: ActionKey.RESCHEDULE,
        },
        [ActionKey.CANCEL]: {
            label: 'Cancelar',
            value: 'cancelar',
            type: ActionKey.CANCEL,
        },
    };

    mapActions(actionKeys?: ActionKey[]): SuggestedAction[] | undefined {
        if (!actionKeys || actionKeys.length === 0) {
            return undefined;
        }

        const mappedActions = actionKeys
            .map((key) => this.actionMappings[key])
            .filter((action): action is SuggestedAction => action !== undefined);

        return mappedActions.length > 0 ? mappedActions : undefined;
    }

    getAction(key: ActionKey): SuggestedAction | undefined {
        return this.actionMappings[key];
    }

    getAllActions(): SuggestedAction[] {
        return Object.values(this.actionMappings);
    }

    isValidActionKey(key: string): key is ActionKey {
        return key in this.actionMappings;
    }

    getCommonActions() {
        return {
            cannotHelp: this.mapActions([ActionKey.HANDOFF, ActionKey.END]),
            confirmation: this.mapActions([ActionKey.CONTINUE, ActionKey.CANCEL]),
            scheduling: this.mapActions([ActionKey.RESCHEDULE, ActionKey.CANCEL, ActionKey.END]),
        };
    }

    normalize(actions?: SuggestedAction[] | ActionKey[]): SuggestedAction[] | undefined {
        if (!actions || actions.length === 0) {
            return undefined;
        }

        const firstItem = actions[0];

        if (typeof firstItem === 'string') {
            return this.mapActions(actions as ActionKey[]);
        }

        return actions as SuggestedAction[];
    }
}
