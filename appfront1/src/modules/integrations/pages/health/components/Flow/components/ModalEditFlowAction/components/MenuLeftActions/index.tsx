import { FC } from "react";
import styled from "styled-components";
import { Wrapper } from "../../../../../../../../../../ui-kissbot-v2/common";
import I18n from '../../../../../../../../../i18n/components/i18n'
import { MenuLeftActionsProps } from "./props";

const Delete = styled(Wrapper)`
  :hover {
    .deleteAction {
        cursor: pointer;
        color: #007bff;
    }
  }
`;

const MoveUp = styled(Wrapper)`
  :hover {
    .moveUpAction {
        cursor: pointer;
        color: #007bff;
    }
  }
`;

const MoveDown = styled(Wrapper)`
  :hover {
    .moveDownAction {
        cursor: pointer;
        color: #007bff;
    }
  }
`;


const MenuLeftActions: FC<MenuLeftActionsProps> = ({
    values,
    index,
    onchange,
    onDeleteAction,
    getTranslation
}) => {

    const move = (moveTo) => {
        const currentAction = values[index];
        if (moveTo === 'UP') {
            const prevAction = values[index - 1];
            values[index - 1] = currentAction;
            values[index] = prevAction;
            onchange(values)
        }

        if (moveTo === 'DOWN') {
            const prevAction = values[index + 1];
            values[index + 1] = currentAction;
            values[index] = prevAction;
            onchange(values)
        }
    }

    return <Wrapper
        position='relative'
        right='-15px'
        width='50px'
        height='115px'
        top='53px'
    >
        {
            index !== 0 &&
            <MoveUp className="control-btn" title={getTranslation("Move up")}>
                <span 
                    className="mdi mdi-24px mdi-arrow-up moveUpAction"
                    onClick={() => move('UP')}
                />
            </MoveUp>
        }
        <Delete className='control-btn' title={getTranslation("Delete")}>
            <span
                className="mdi mdi-24px mdi-delete-outline deleteAction"
                onClick={() => {
                    values.splice(index, 1)
                    onDeleteAction(values);
                }} 
            />
        </Delete>
        {
            index !== values.length - 1 &&
            <MoveDown className="control-btn" title={getTranslation("Move down")}>
                <span 
                    className="mdi mdi-24px mdi-arrow-down moveDownAction" 
                    onClick={() => move('DOWN')}
                />
            </MoveDown>
        }
    </Wrapper>

}

export default I18n(MenuLeftActions);