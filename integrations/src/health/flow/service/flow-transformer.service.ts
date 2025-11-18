import { Injectable, Logger } from '@nestjs/common';
import { orderBy } from 'lodash';
import {
  FlowAction,
  FlowActionConfirmationRules,
  FlowActionRules,
  FlowActionType,
  IFlowActionType,
} from '../interfaces/flow.interface';

@Injectable()
export class FlowTransformerService {
  private readonly logger = new Logger(FlowTransformerService.name);
  public transformFlowActions(flowActions: FlowAction[]): FlowAction[] {
    try {
      const flowActionsByType = flowActions.reduce<{ [key: string]: FlowAction[] }>((acc, flowAction) => {
        if (!acc[flowAction.type]) {
          acc[flowAction.type] = [];
        }
        acc[flowAction.type].push(flowAction);
        return acc;
      }, {});

      if (flowActionsByType[FlowActionType.rules]?.length > 0) {
        flowActionsByType[FlowActionType.rules] = this.flowActionRules(flowActionsByType[FlowActionType.rules]);
      }

      if (flowActionsByType[FlowActionType.rulesConfirmation]?.length > 0) {
        flowActionsByType[FlowActionType.rulesConfirmation] = this.flowActionConfirmationRules(
          flowActionsByType[FlowActionType.rulesConfirmation],
        );
      }

      return Object.keys(flowActionsByType).reduce((acc, flowActionType) => {
        acc.push(...flowActionsByType[flowActionType]);
        return acc;
      }, []);
    } catch (e) {
      this.logger.error('FlowTransformerService.transformFlowActions', e);
      return [];
    }
  }

  private flowActionRules(flowActions: FlowAction[]): FlowAction[] {
    try {
      const flowActionRule: FlowActionRules = {};

      orderBy(
        // priority é opcional, e como preciso ordenar, quem não tem o campo, coloco um valor padrão = 0
        flowActions.map((action: IFlowActionType<FlowActionRules>) => {
          if (action.element.priority) {
            action.element.priority = parseInt(String(action.element.priority), 10);
            return action;
          }

          action.element.priority = 0;
          return action;
        }),
        'element.priority',
        'desc',
      ).forEach((flowAction: IFlowActionType<FlowActionRules>) => {
        if (!flowActionRule.price && flowAction.element?.price) {
          flowActionRule.price = flowAction.element.price;
        }

        if (!flowActionRule.address && flowAction.element?.address) {
          flowActionRule.address = flowAction.element.address;
        }

        if (!flowActionRule.ifEmptyDataGoto && flowAction.element?.ifEmptyDataGoto) {
          const [, interactionId] = flowAction.element.ifEmptyDataGoto?.split(':');
          flowActionRule.ifEmptyDataGoto = interactionId;
        }

        if (!flowActionRule.noAvailableDatesMessage && flowAction.element?.noAvailableDatesMessage) {
          flowActionRule.noAvailableDatesMessage = flowAction.element.noAvailableDatesMessage;
        }

        if (!flowActionRule.guidanceAfterScheduled && flowAction.element?.guidanceAfterScheduled) {
          flowActionRule.guidanceAfterScheduled = flowAction.element.guidanceAfterScheduled;
        }

        if (!flowActionRule.guidanceBeforeScheduled && flowAction.element?.guidanceBeforeScheduled) {
          flowActionRule.guidanceBeforeScheduled = flowAction.element.guidanceBeforeScheduled;
        }

        if (flowActionRule.fromDay === undefined && flowAction.element?.fromDay !== undefined) {
          flowActionRule.fromDay = flowAction.element.fromDay;
        }

        if (flowActionRule.limit === undefined && flowAction.element?.limit !== undefined) {
          flowActionRule.limit = flowAction.element.limit;
        }

        if (flowActionRule.priority === undefined && flowAction.element?.priority !== undefined) {
          flowActionRule.priority = flowAction.element.priority;
        }

        if (!flowActionRule.sortMethod && flowAction.element?.sortMethod) {
          flowActionRule.sortMethod = flowAction.element.sortMethod;
        }

        if (flowActionRule.untilDay === undefined && flowAction.element?.untilDay !== undefined) {
          flowActionRule.untilDay = flowAction.element.untilDay;
        }

        if (!flowActionRule.hasOwnProperty('skipSelection') && flowAction.element?.skipSelection !== undefined) {
          flowActionRule.skipSelection = flowAction.element.skipSelection;
        }

        if (!flowActionRule.hasOwnProperty('canReturnStep') && flowAction.element?.canReturnStep !== undefined) {
          flowActionRule.canReturnStep = flowAction.element.canReturnStep;
        }

        if (!flowActionRule.hasOwnProperty('skipIfNoItems') && flowAction.element?.skipIfNoItems !== undefined) {
          flowActionRule.skipIfNoItems = flowAction.element.skipIfNoItems;
        }

        if (!flowActionRule.hasOwnProperty('canNotCancel') && flowAction.element?.canNotCancel !== undefined) {
          flowActionRule.canNotCancel = flowAction.element.canNotCancel;
        }

        if (
          !flowActionRule.hasOwnProperty('canNotConfirmActive') &&
          flowAction.element?.canNotConfirmActive !== undefined
        ) {
          flowActionRule.canNotConfirmActive = flowAction.element.canNotConfirmActive;
        }

        if (
          !flowActionRule.hasOwnProperty('canNotConfirmPassive') &&
          flowAction.element?.canNotConfirmPassive !== undefined
        ) {
          flowActionRule.canNotConfirmPassive = flowAction.element.canNotConfirmPassive;
        }

        if (!flowActionRule.hasOwnProperty('canNotReschedule') && flowAction.element?.canNotReschedule !== undefined) {
          flowActionRule.canNotReschedule = flowAction.element.canNotReschedule;
        }

        if (!flowActionRule.hasOwnProperty('canNotView') && flowAction.element?.canNotView !== undefined) {
          flowActionRule.canNotView = flowAction.element.canNotView;
        }

        if (!flowActionRule.hasOwnProperty('randomize') && flowAction.element?.randomize !== undefined) {
          flowActionRule.randomize = flowAction.element.randomize;
        }

        if (!flowActionRule.hasOwnProperty('skipIfOneItem') && flowAction.element?.skipIfOneItem !== undefined) {
          flowActionRule.skipIfOneItem = flowAction.element.skipIfOneItem;
        }
      });

      return [
        {
          type: FlowActionType.rules,
          element: flowActionRule,
        },
      ];
    } catch (e) {
      this.logger.error('FlowTransformerService.flowActionRules', e);
      return [];
    }
  }

  private flowActionConfirmationRules(flowActions: FlowAction[]): FlowAction[] {
    try {
      // const flowActionRule: FlowActionConfirmationRules = {};

      return [
        orderBy(
          // priority é opcional, e como preciso ordenar, quem não tem o campo, coloco um valor padrão = 0
          flowActions.map((action: IFlowActionType<FlowActionConfirmationRules>) => {
            if (action.element.priority) {
              action.element.priority = parseInt(String(action.element.priority), 10);
              return action;
            }

            action.element.priority = 0;
            return action;
          }),
          'element.priority',
          'desc',
        )[0],
      ];

      // .forEach(({ element }: IFlowActionType<FlowActionConfirmationRules>) => {
      //   if (!flowActionRule.confirmationGoto && element?.confirmationGoto) {
      //     const [, interactionId] = element.confirmationGoto?.split(':');
      //     flowActionRule.confirmationGoto = interactionId;
      //   }

      //   if (!flowActionRule.cancelGoto && element?.cancelGoto) {
      //     const [, interactionId] = element.cancelGoto?.split(':');
      //     flowActionRule.cancelGoto = interactionId;
      //   }

      //   if (!flowActionRule.cancelMessage && element?.cancelMessage) {
      //     flowActionRule.cancelMessage = element.cancelMessage;
      //   }

      //   if (!flowActionRule.confirmationMessage && element?.confirmationMessage) {
      //     flowActionRule.confirmationMessage = element.confirmationMessage;
      //   }

      //   if (!flowActionRule.onErrorGoto && element?.onErrorGoto) {
      //     flowActionRule.onErrorGoto = element.onErrorGoto;
      //   }

      //   if (
      //     !flowActionRule.hasOwnProperty('sendGuidanceOnConfirmSchedule') &&
      //     element?.sendGuidanceOnConfirmSchedule !== undefined
      //   ) {
      //     flowActionRule.sendGuidanceOnConfirmSchedule = element.sendGuidanceOnConfirmSchedule;
      //   }

      //   if (!flowActionRule.hasOwnProperty('askReschedule') && element?.askReschedule !== undefined) {
      //     flowActionRule.askReschedule = element.askReschedule;
      //   }

      //   if (!flowActionRule.rescheduleGoto && element?.rescheduleGoto) {
      //     flowActionRule.rescheduleGoto = element.rescheduleGoto;
      //   }
      // });

      // return [
      //   {
      //     type: FlowActionType.rulesConfirmation,
      //     element: flowActionRule,
      //   },
      // ];
    } catch (e) {
      this.logger.error('FlowTransformerService.flowActionConfirmationRules', e);
      return [];
    }
  }
}
