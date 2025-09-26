import { TemplateMessage, TemplateVariable } from "../../liveAgent/components/TemplateMessageList/interface";

export const defaultVars = [
    {
        label: 'Nome do agente',
        value: 'agent.name',
        type: '@sys.text',
        required: true,
        _id: 'agent_name',
    },
    {
        label: 'ID da conversa',
        value: 'conversation.iid',
        type: '@sys.text',
        required: true,
        _id: 'conversation_iid',
    },
    {
        label: 'Data de criação',
        value: 'conversation.createdAt',
        type: '@sys.text',
        required: true,
        _id: 'conversation_createdAt',
    },
    {
        label: 'Nome do usuário',
        value: 'user.name',
        type: '@sys.text',
        required: true,
        _id: 'user_name',
    },
    {
        label: 'Telefone do usuário',
        value: 'user.phone',
        type: '@sys.text',
        required: true,
        _id: 'user_phone',
    },
];

export const getUndefinedVariables = (template: TemplateMessage) => {
    const list: TemplateVariable[] = [];

    template.message?.replace(new RegExp(/{{(.*?)}}/g), (match: any) => {
        let variable = match.replace(/{{/g, '');
        variable = variable.replace(/}}/g, '');

        const templateVariables = [...defaultVars, ...template.variables];

        const exist = templateVariables.find((v) => v.value === variable);

        if (exist) {
            if (!list.find(ele => ele._id === exist._id)){
                list.push({
                    ...exist,
                });
            }

            return '';
        }
        return '';
    });

    return list;
};