import { Button, Col, Form, Row, Select, Space, Tag } from 'antd';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { normalizeText } from '../../../../../../utils/normalize-text';
import { isUserAgent } from '../../../../../../utils/UserPermission';
import { useLanguageContext } from '../../../../../i18n/context';
import { useConversationObjectives } from '../../../ClosingMessageModal/closing-modal-with-categorization/hooks/use-conversation-objectives';
import { useConversationOutcomes } from '../../../ClosingMessageModal/closing-modal-with-categorization/hooks/use-conversation-outcomes';
import { SelectableOption } from '../../../ClosingMessageModal/closing-modal-with-categorization/interfaces';

export const CategorizationUpdater = () => {
    const { getTranslation } = useLanguageContext();
    const { conversationOutcomes, isFetchingConversationOutcomes } = useConversationOutcomes();
    const { conversationObjectives, isFetchingConversationObjectives } = useConversationObjectives();
    const loggedUser = useSelector((state: any) => state.loginReducer.loggedUser);
    const selectedWorkspace = useSelector((state: any) => state.workspaceReducer.selectedWorkspace);
    const cantUserAgent = isUserAgent(loggedUser, selectedWorkspace._id);

    const conversationOutcomeOptions = useMemo(() => {
        if (!conversationOutcomes) {
            return [];
        }

        const activeOptions: SelectableOption[] = [];
        const deletedOptions: SelectableOption[] = [];

        conversationOutcomes.data.forEach((outcome) => {
            const option = {
                value: outcome.id,
                label: (
                    <Space>
                        <span>{outcome.name}</span>
                        {outcome.deletedAt && <Tag color='red'>Inativo</Tag>}
                    </Space>
                ),
                name: outcome.name,
                disabled: !!outcome.deletedAt,
            };
            if (outcome.deletedAt) {
                deletedOptions.push(option);
            } else {
                activeOptions.push(option);
            }
        });

        return [...activeOptions, ...deletedOptions];
    }, [conversationOutcomes]);

    const conversationObjectivesOptions = useMemo(() => {
        if (!conversationObjectives) {
            return [];
        }

        const activeOptions: SelectableOption[] = [];
        const deletedOptions: SelectableOption[] = [];

        conversationObjectives.data.forEach((objective) => {
            const option = {
                value: objective.id,
                label: (
                    <Space>
                        <span>{objective.name}</span>
                        {objective.deletedAt && <Tag color='red'>Inativo</Tag>}
                    </Space>
                ),
                name: objective.name,
                disabled: !!objective.deletedAt,
            };
            if (objective.deletedAt) {
                deletedOptions.push(option);
            } else {
                activeOptions.push(option);
            }
        });

        return [...activeOptions, ...deletedOptions];
    }, [conversationObjectives]);

    return (
        <Row gutter={[16, 16]}>
            {!cantUserAgent && (
                <Col span={24}>
                    {getTranslation(
                        'Você pode alterar o Objetivo e o Desfecho deste atendimento selecionando uma nova opção, mas não é possível removê-los.'
                    )}
                </Col>
            )}
            <Col span={24}>
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item
                            name='objectiveId'
                            label={getTranslation('Objective')}
                            rules={
                                !cantUserAgent
                                    ? [{ required: true, message: getTranslation('This field is required') }]
                                    : undefined
                            }
                        >
                            <Select
                                disabled={cantUserAgent}
                                allowClear
                                loading={isFetchingConversationObjectives}
                                options={conversationObjectivesOptions}
                                placeholder={getTranslation('Select an objective')}
                                showSearch
                                filterOption={(search, option) => {
                                    return Boolean(normalizeText(option?.value).includes(normalizeText(search)));
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            name='outcomeId'
                            label={getTranslation('Outcome')}
                            rules={
                                !cantUserAgent
                                    ? [{ required: true, message: getTranslation('This field is required') }]
                                    : undefined
                            }
                        >
                            <Select
                                disabled={cantUserAgent}
                                allowClear
                                loading={isFetchingConversationOutcomes}
                                options={conversationOutcomeOptions}
                                placeholder={getTranslation('Select an outcome')}
                                showSearch
                                filterOption={(search, option) => {
                                    return Boolean(normalizeText(option?.value).includes(normalizeText(search)));
                                }}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
};

CategorizationUpdater.Footer = ({ isFinishing, handleClose, getTranslation }) => {
    return (
        <>
            <Button onClick={handleClose} className='antd-span-default-color' disabled={isFinishing}>
                {getTranslation('Back')}
            </Button>
            <Button
                type='primary'
                htmlType='submit'
                className='antd-span-default-color'
                form='finish-categorization-form'
                loading={isFinishing}
            >
                {getTranslation('Save')}
            </Button>
        </>
    );
};
