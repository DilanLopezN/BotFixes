import { FC } from 'react';
import { Modal } from 'antd';
import AgentForm from '../AgentForm';
import { Bot } from '../../../../../../model/Bot';
import { HealthIntegration } from '../../../../../../model/Integrations';

interface CreateAgentModalProps {
    visible: boolean;
    onCancel: () => void;
    onOk: () => void;
    formik: any;
    getTranslation: (key: string) => string;
    bots: Bot[];
    personalities: { identifier: string; content: string }[];
    integrations: HealthIntegration[];
}

const CreateAgentModal: FC<CreateAgentModalProps> = ({
    visible,
    onCancel,
    onOk,
    formik,
    getTranslation,
    bots,
    personalities,
    integrations
}) => {
    return (
        <Modal
            title={getTranslation('Criar Agente')}
            open={visible}
            onOk={onOk}
            onCancel={onCancel}
            confirmLoading={formik.isSubmitting}
            width={600}
            okButtonProps={{
                className: 'antd-span-default-color',
            }}
        >
            <form>
                <AgentForm
                    formik={formik}
                    getTranslation={getTranslation}
                    bots={bots}
                    personalities={personalities}
                    integrations={integrations}
                />
            </form>
        </Modal>
    );
};

export default CreateAgentModal;