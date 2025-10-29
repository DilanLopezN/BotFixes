import { Button, Col, Form, Input, Row, Select, Space, Tag } from 'antd';
import { useMemo } from 'react';
import { normalizeText } from '../../../../../utils/normalize-text';
import I18n from '../../../../i18n/components/i18n';
import { useConversationObjectives } from './hooks/use-conversation-objectives/use-conversation-objectives';
import { useConversationOutcomes } from './hooks/use-conversation-outcomes/use-conversation-outcomes';
import { useTags } from './hooks/use-tags';
import { CategorizationStepFooterProps, CategorizationStepProps, SelectableOption } from './interfaces';

const CategorizationStepComponent = ({
    teams,
    conversation,
    getTranslation,
    isDescriptionEnabled,
}: CategorizationStepProps) => {
    const { conversationOutcomes, isFetchingConversationOutcomes } = useConversationOutcomes();
    const { conversationObjectives, isFetchingConversationObjectives } = useConversationObjectives();
    const { tags, isFetchingTags } = useTags(getTranslation);

    const [form] = Form.useForm();
    const handleObjectiveChange = (value) => {
        if (value) {
            form.setFieldsValue({ outcomeId: undefined });
        }
    };

    const handleOutcomeChange = (value) => {
        if (value) {
            form.setFieldsValue({ objectiveId: undefined });
        }
    };

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

    const tagsOptions = useMemo(() => {
        if (!tags) {
            return [];
        }

        return tags.map((tag) => {
            return { value: tag.name, label: tag.name };
        });
    }, [tags]);

    const responsibleTeam = useMemo(() => {
        if (!teams || !conversation) {
            return undefined;
        }

        return teams.find((team) => {
            return team._id === conversation.assignedToTeamId;
        });
    }, [conversation, teams]);

    const isCategorizationRequired = responsibleTeam && responsibleTeam?.requiredConversationCategorization;

    return (
        <Row gutter={[16, 16]}>
            <Col span={24}>
                {getTranslation(
                    'Now that you have completed the appointment, simply categorize it by indicating the reason for its completion (completion objectives) and the outcome of the service (result).'
                )}
            </Col>
            <Col span={24}>
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item
                            name='objectiveId'
                            label={getTranslation('Objective')}
                            rules={
                                isCategorizationRequired
                                    ? [{ required: true, message: getTranslation('This field is required') }]
                                    : undefined
                            }
                        >
                            <Select
                                allowClear
                                loading={isFetchingConversationObjectives}
                                options={conversationObjectivesOptions}
                                placeholder={getTranslation('Select or type a objective')}
                                onChange={handleObjectiveChange}
                                showSearch
                                filterOption={(search, option) => {
                                    return Boolean(normalizeText(option?.name).includes(normalizeText(search)));
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            name='outcomeId'
                            label={getTranslation('Outcome')}
                            rules={
                                isCategorizationRequired
                                    ? [{ required: true, message: getTranslation('This field is required') }]
                                    : undefined
                            }
                        >
                            <Select
                                allowClear
                                loading={isFetchingConversationOutcomes}
                                options={conversationOutcomeOptions}
                                placeholder={getTranslation('Select or type a outcome')}
                                onChange={handleOutcomeChange}
                                showSearch
                                filterOption={(search, option) => {
                                    return Boolean(normalizeText(option?.name).includes(normalizeText(search)));
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name='conversationTags' label={getTranslation('Tags')}>
                            <Select
                                allowClear
                                mode='multiple'
                                loading={isFetchingTags}
                                options={tagsOptions}
                                placeholder={getTranslation('Select or type a tag')}
                                showSearch
                                filterOption={(search, option) => {
                                    return Boolean(normalizeText(option?.value).includes(normalizeText(search)));
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item name='description' label={getTranslation('Observation')}>
                            <Input.TextArea
                                style={{
                                    resize: 'none',
                                }}
                                rows={3}
                                maxLength={4096}
                                placeholder={getTranslation('Type additional notes about the conversation here')}
                                disabled={!isDescriptionEnabled}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
};

export const CategorizationStep = I18n(CategorizationStepComponent);

CategorizationStep.Footer = ({ isFinishing, handleClose, getTranslation }: CategorizationStepFooterProps) => {
    return (
        <>
            <Button onClick={handleClose} className='antd-span-default-color' disabled={isFinishing}>
                {getTranslation('Back')}
            </Button>
            <Button
                type='primary'
                htmlType='submit'
                className='antd-span-default-color'
                form='finish-message-form'
                loading={isFinishing}
            >
                {getTranslation('Close')}
            </Button>
        </>
    );
};
