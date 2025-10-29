import { Interaction } from "../model/Interaction";


export const interactionSelector = (disabledFields: boolean, unchangedInteraction: Interaction, currentInteraction: Interaction) => {


    return disabledFields ? unchangedInteraction : currentInteraction;
}

