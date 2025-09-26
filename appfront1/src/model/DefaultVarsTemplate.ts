import { TemplateVariable } from "../modules/liveAgent/components/TemplateMessageList/interface";

export const defaultVarsTemplate: TemplateVariable[] = [
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
    // {
    //     label: 'Data de criação',
    //     value: 'conversation.createdAt',
    //     type: '@sys.text',
    //     required: true,
    //     _id: 'conversation_createdAt',
    // },
    {
        label: 'Nome do contato',
        value: 'user.name',
        type: '@sys.text',
        required: true,
        _id: 'user_name',
    },
    {
        label: 'Telefone do contato',
        value: 'user.phone',
        type: '@sys.text',
        required: true,
        _id: 'user_phone',
    },
    // {
    //     label: 'Nome da empresa',
    //     value: 'company.name',
    //     type: '@sys.text',
    //     required: true,
    //     _id: 'company_name',
    // },
];