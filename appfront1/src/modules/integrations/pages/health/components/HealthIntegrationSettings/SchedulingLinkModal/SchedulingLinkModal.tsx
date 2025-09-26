import { Button, Drawer, Form, Input, Spin } from 'antd';
import { FC, useEffect, useState } from 'react';
import { HealthIntegration, Scheduling, SchedulingGuidanceFormat } from '../../../../../../../model/Integrations';
import { Wrapper } from '../../../../../../../ui-kissbot-v2/common';
import { addNotification } from '../../../../../../../utils/AddNotification';
import i18n from '../../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../../i18n/interface/i18n.interface';
import { HealthService } from '../../../../../services/HealthService';

interface SchedulingLinkModalProps {
    integration: HealthIntegration;
    workspaceId: string;
    visible: boolean;
    onClose: () => void;
    onIntegrationUpdated?: (updatedIntegration: HealthIntegration) => void;
}

const SchedulingLinkModal: FC<SchedulingLinkModalProps & I18nProps> = (props) => {
    const { getTranslation, integration, workspaceId, visible, onClose } = props;

    const defaultTemplateScheduling: { scheduling: Scheduling } = {
        scheduling: {
            active: false,
            identifier: '',
            guidanceFormatType: SchedulingGuidanceFormat.file,
            createScheduleNotification: false,
            createSchedulingLinkAfterCreateSchedule: false,
            config: {
                resources: {
                    cancellation: {
                        enableScheduleCancellation: false,
                        hoursBeforeAppointmentToAllowCancellation: undefined,
                    },
                    confirmation: {
                        enableScheduleConfirmation: false,
                        hoursBeforeAppointmentToAllowConfirmation: undefined,
                    },
                    rescheduling: {
                        enableScheduleRescheduling: false,
                        hoursBeforeAppointmentToAllowRescheduling: undefined,
                    },
                },
                name: '',
                friendlyName: '',
                logo: '',
                whatsapp: {
                    phoneNumber: '',
                    startSchedulingMessage: '',
                    startReschedulingMessage: '',
                },
            },
        },
    };

    const [loading, setLoading] = useState<boolean>(false);
    const [configTextTemplate, setConfigTextTemplate] = useState<string>('');
    const [currentIntegration, setCurrentIntegration] = useState<HealthIntegration>(integration);

    useEffect(() => {
        if (integration?._id) {
            fetchCurrentIntegration();
        } else {
            setCurrentIntegration(integration);
        }
    }, [integration?._id, workspaceId]);

    useEffect(() => {
        if (visible) {
            updateConfigTemplate();
        }
    }, [visible, currentIntegration, integration._id]);

    const fetchCurrentIntegration = async () => {
        if (!integration?._id || !workspaceId) return;

        setLoading(true);

        const integrations = await HealthService.getHealthIntegrations(workspaceId).catch(() => null);

        if (integrations && integrations.data) {
            const updateIntegration = integrations.data.find((item) => item._id === integration._id);
            if (updateIntegration) {
                setCurrentIntegration(updateIntegration);
            }
        }

        setLoading(false);
    };

    const updateConfigTemplate = () => {
        const isSchedulingEqualToDefault = (scheduling: Scheduling | undefined) => {
            if (!scheduling) return true;

            const defaultScheduling = defaultTemplateScheduling.scheduling;

            return (
                scheduling.active === defaultScheduling.active &&
                scheduling.identifier === defaultScheduling.identifier &&
                scheduling.guidanceFormatType === defaultScheduling.guidanceFormatType &&
                scheduling.createSchedulingLinkAfterCreateSchedule ===
                    defaultScheduling.createSchedulingLinkAfterCreateSchedule &&
                JSON.stringify(scheduling.config) === JSON.stringify(defaultScheduling.config)
            );
        };

        // Verifica se o currentIntegration ou integration tem scheduling igual ao default
        const currentSchedulingIsDefault = isSchedulingEqualToDefault(currentIntegration?.scheduling);
        const integrationSchedulingIsDefault = isSchedulingEqualToDefault(integration?.scheduling);

        if (currentSchedulingIsDefault && integrationSchedulingIsDefault) {
            setConfigTextTemplate(JSON.stringify(defaultTemplateScheduling, null, 2));
        } else if (!currentSchedulingIsDefault) {
            const configJson = {
                scheduling: currentIntegration.scheduling,
            };
            setConfigTextTemplate(JSON.stringify(configJson, null, 2));
        } else if (!integrationSchedulingIsDefault) {
            const configJson = {
                scheduling: integration.scheduling,
            };
            setConfigTextTemplate(JSON.stringify(configJson, null, 2));
        }
    };

    const validateJsonScheduling = (jsonString: string) => {
        try {
            const parsed = JSON.parse(jsonString);
            return parsed && typeof parsed === 'object' && parsed.scheduling;
        } catch (parseError) {
            return false;
        }
    };

    const saveConfigJsonScheduling = async () => {
        if (!validateJsonScheduling(configTextTemplate)) {
            addNotification({
                title: getTranslation('Error'),
                message: getTranslation('Invalid JSON format'),
                type: 'danger',
            });
            return;
        }

        const schedulingConfig = JSON.parse(configTextTemplate);

        if (!schedulingConfig.scheduling) {
            addNotification({
                type: 'danger',
                title: getTranslation('Error'),
                message: getTranslation('Invalid scheduling configuration format'),
            });
            return;
        }

        if (
            !schedulingConfig.scheduling.hasOwnProperty('active') ||
            !schedulingConfig.scheduling.hasOwnProperty('identifier')
        ) {
            addNotification({
                type: 'danger',
                title: getTranslation('Error'),
                message: getTranslation('Missing required scheduling fields'),
            });
            return;
        }

        setLoading(true);

        const updatedIntegration = {
            ...currentIntegration,
            scheduling: schedulingConfig.scheduling,
        };

        let error: any;
        await HealthService.updateHealthIntegration(
            workspaceId,
            updatedIntegration,
            (responseError) => (error = responseError)
        );

        setLoading(false);

        if (error) {
            addNotification({
                type: 'danger',
                title: getTranslation('Error'),
                message: error?.message || getTranslation('Error saving configuration'),
            });
            return;
        }

        setCurrentIntegration(updatedIntegration);

        if (props.onIntegrationUpdated) {
            props.onIntegrationUpdated(updatedIntegration);
        }

        addNotification({
            type: 'success',
            title: getTranslation('Success'),
            message: getTranslation('Configuration saved successfully'),
        });

        onClose();
    };

    return (
        <Drawer
            title={<strong style={{ color: '#696969' }}>{getTranslation('Scheduling link settings')}</strong>}
            placement='right'
            onClose={onClose}
            open={visible}
            width={800}
            extra={
                <Button
                    type='primary'
                    className='antd-span-default-color'
                    onClick={saveConfigJsonScheduling}
                    loading={loading}
                >
                    {getTranslation('Save')}
                </Button>
            }
        >
            <Wrapper flexBox flexDirection='column' padding='20px'>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Spin size='large' />
                    </div>
                ) : (
                    <Form layout='vertical'>
                        <Form.Item
                            label={
                                <span style={{ color: '#696969' }}>
                                    {getTranslation('Appointment parameters to be filled in:')}
                                </span>
                            }
                            help={!validateJsonScheduling(configTextTemplate) ? getTranslation('Invalid JSON') : ''}
                            validateStatus={!validateJsonScheduling(configTextTemplate) ? 'error' : ''}
                        >
                            <Input.TextArea
                                size='large'
                                value={configTextTemplate}
                                onChange={(event) => setConfigTextTemplate(event.target.value)}
                                autoSize={{ minRows: 20, maxRows: 30 }}
                                style={{ fontFamily: 'monospace' }}
                            />
                        </Form.Item>
                    </Form>
                )}
            </Wrapper>
        </Drawer>
    );
};

export default i18n(SchedulingLinkModal) as FC<SchedulingLinkModalProps>;
