import axios from 'axios';
import Cookies from 'universal-cookie';
import { MANAGER_TOKEN } from '../integrationForm';

const ecomaxInstance = axios.create({
    // baseURL: 'https://ecomax.guardasaude.com.br/',
    baseURL: 'https://ecomax.sisclinica.com.br/',
    timeout: 15000,
});

const usuyInstance = axios.create({
    baseURL: 'https://usuy.guardasaude.com.br/',
    timeout: 15000,
});

const getHeaders = (token?: string) => {
    if (!token) {
        const cookies = new Cookies();
        const defaultToken = cookies.get(MANAGER_TOKEN);
        token = defaultToken;
    }

    return {
        Authorization: `Bearer ${token}`,
    };
};

const getInstance = (workspaceId: string) => {
    switch (workspaceId) {
        case '5ee0f255afd25a000704aba9':
            return ecomaxInstance;

        case '5d72b996c14f04001b7afe8b':
            return usuyInstance;

        default:
            break;
    }
};

const ManagerService = {
    auth: async (workspaceId: string, { password, username }): Promise<any> => {
        return await getInstance(workspaceId)?.post('/agendador/auth/login', {
            password,
            username,
        });
    },
    authPatient: async (workspaceId: string, { cpf, bornDate }): Promise<any> => {
        return await getInstance(workspaceId)?.post(
            '/agendador/auth/gera-token-paciente',
            {
                cpfOrProtocolo: cpf,
                dataNascimento: bornDate,
            },
            {
                headers: {
                    ...getHeaders(),
                },
            }
        );
    },
    getPatient: async (workspaceId: string, { token }): Promise<any> => {
        return await getInstance(workspaceId)?.get('/agendador/pacientes/listar/', {
            headers: {
                ...getHeaders(token),
            },
        });
    },
    getPatientAppointments: async (workspaceId: string, { patientId }): Promise<any> => {
        return await getInstance(workspaceId)?.get('/atendimento/agendamentos/futuros', {
            headers: {
                ...getHeaders(),
            },
            params: {
                paciente: patientId,
            },
        });
    },
    getImages: async (workspaceId: string, { appointmentId }): Promise<any> => {
        return await getInstance(workspaceId)?.get(`/atendimento/atendimentos/${appointmentId}/foto`, {
            headers: {
                ...getHeaders(),
            },
        });
    },
    getImageTypes: async (workspaceId: string): Promise<any> => {
        return await getInstance(workspaceId)?.get(`/atendimento/tipos-imagem`, {
            headers: {
                ...getHeaders(),
            },
        });
    },
    uploadImage: async (
        workspaceId: string,
        { appointmentId, blob, fileName, attachmentId, imageType }
    ): Promise<any> => {
        const data = new FormData();
        data.append('name', fileName);

        const fetchBlob = async () => {
            const response = await fetch(blob);
            const data = await response.blob();
            const metadata = {
                type: 'image/jpeg',
            };
            return new File([data], fileName, metadata);
        };

        const file = await fetchBlob();
        data.append('arquivo', file);

        return await getInstance(workspaceId)?.post(`/atendimento/atendimentos/${appointmentId}/foto`, data, {
            headers: {
                ...getHeaders(),
                'Content-Type': 'multipart/form-data',
            },
            params: {
                tipoImagem: imageType.code,
                nome: imageType.name,
                observacao: attachmentId,
            },
        });
    },
};

export { ManagerService };
