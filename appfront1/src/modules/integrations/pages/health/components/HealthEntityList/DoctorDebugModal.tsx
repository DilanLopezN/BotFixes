import { Button, Form, Input, InputNumber, Modal, Spin } from 'antd';
import { FC, useState } from 'react';
import { connect } from 'react-redux';
import { isSystemAdmin, isSystemCsAdmin, isSystemSupportAdmin } from '../../../../../../utils/UserPermission';
import { HealthEntity } from '../../../../../../model/Integrations';
import { addNotification } from '../../../../../../utils/AddNotification';
import { apiInstance } from '../../../../../../utils/Http';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';

interface Props {
    doctor: HealthEntity;
    workspaceId: string;
    integrationId: string;
    isOpen: boolean;
    onClose: () => void;
}

interface StateProps {
    loggedUser: any;
}

interface DebugRequest {
    doctorCode: string;
    insuranceCode: string;
    age: number;
}

const DoctorDebugModal = ({
    getTranslation,
    doctor,
    workspaceId,
    integrationId,
    isOpen,
    onClose,
    loggedUser,
}: Props & I18nProps & StateProps) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    
    const canDebug =
        loggedUser &&
        (isSystemAdmin(loggedUser) || isSystemCsAdmin(loggedUser) || isSystemSupportAdmin(loggedUser));

    const handleDebug = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            
            const debugRequest: DebugRequest = {
                doctorCode: doctor.code || '',
                insuranceCode: values.insuranceCode,
                age: parseInt(values.age),
            };

            const result = await apiInstance.post(
                `/integrations/${integrationId}/query/doctor/status`,
                debugRequest,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            setResponse(result.data);
            addNotification({
                message: getTranslation('Debug request completed successfully'),
                title: getTranslation('Success'),
                type: 'success',
            });
        } catch (error) {
            console.error('Debug error:', error);
            addNotification({
                message: getTranslation('Error during debug request'),
                title: getTranslation('Error'),
                type: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setResponse(null);
        form.resetFields();
        onClose();
    };

    return (
        <>
            <style>
                {`
                    .debug-button-white-text,
                    .debug-button-white-text span,
                    .debug-button-white-text:hover,
                    .debug-button-white-text:focus,
                    .debug-button-white-text:active {
                        color: white !important;
                    }
                `}
            </style>
            <Modal
            title={`${getTranslation('Debug Doctor')}: ${doctor.friendlyName || doctor.name}`}
            open={isOpen}
            onCancel={handleClose}
            width={response ? 800 : 450}
            footer={[
                <Button key="close" onClick={handleClose}>
                    {getTranslation('Close')}
                </Button>,
                !response && canDebug && (
                    <Button
                        key="debug"
                        type="primary"
                        loading={loading}
                        onClick={handleDebug}
                        className="debug-button-white-text"
                        style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                    >
                        {getTranslation('Debug')}
                    </Button>
                ),
            ].filter(Boolean)}
        >
            <div style={{ marginBottom: response ? '20px' : '10px' }}>
                <strong>{getTranslation('Doctor Code')}: </strong>
                {doctor.code || getTranslation('Not defined')}
            </div>

            {!response ? (
                <Form form={form} layout="vertical" style={{ marginTop: '10px' }}>
                    <Form.Item
                        name="insuranceCode"
                        label={getTranslation('Insurance Code')}
                        rules={[
                            {
                                required: true,
                                message: getTranslation('Please enter the insurance code'),
                            },
                        ]}
                    >
                        <Input placeholder={getTranslation('Enter insurance code')} />
                    </Form.Item>

                    <Form.Item
                        name="age"
                        label={getTranslation('Age')}
                        rules={[
                            {
                                required: true,
                                message: getTranslation('Please enter the age'),
                            },
                            {
                                validator: (_, value) => {
                                    if (value === null || value === undefined) {
                                        return Promise.resolve();
                                    }
                                    if (value >= 0 && value <= 120) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error(getTranslation('Age must be between 0 and 120')));
                                },
                            },
                        ]}
                    >
                        <InputNumber
                            min={0}
                            max={120}
                            placeholder={getTranslation('Enter age')}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                </Form>
            ) : (
                <div
                    style={{
                        marginTop: '10px',
                    }}
                >
                    <div
                        style={{
                            maxHeight: '500px',
                            overflow: 'auto',
                        }}
                    >
                        {response?.data?.data && Array.isArray(response.data.data) ? (
                            <div>
                                {/* Metadata */}
                                {response.data.metadata && (
                                    <div
                                        style={{
                                            marginBottom: '20px',
                                            padding: '12px',
                                            backgroundColor: '#e6f7ff',
                                            borderRadius: '6px',
                                            border: '1px solid #91d5ff',
                                        }}
                                    >
                                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#0050b3' }}>
                                            ℹ️ Informações da Requisição
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#595959' }}>
                                            <strong>Duração:</strong> {response.data.metadata.executionTime} | 
                                            <strong> Versão:</strong> {response.data.metadata.version} | 
                                            <strong> Hora:</strong> {response.data.metadata.requestStarted}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Data items */}
                                {response.data.data.map((item: any, index: number) => (
                                    <div
                                        key={index}
                                        style={{
                                            marginBottom: '12px',
                                            padding: '12px',
                                            border: '1px solid #e8e8e8',
                                            borderRadius: '6px',
                                            backgroundColor: item.VALOR ? '#f9f9f9' : '#fff5f5',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: 'bold',
                                                marginBottom: '4px',
                                                color: '#1a1a1a',
                                                fontSize: '14px',
                                            }}
                                        >
                                            {item.CHAVE}
                                        </div>
                                        <div
                                            style={{
                                                color: item.VALOR ? '#2d2d2d' : '#999',
                                                fontSize: '13px',
                                                fontStyle: item.VALOR ? 'normal' : 'italic',
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {item.VALOR || 'Sem dados'}
                                        </div>
                                        {item.VALOR && item.VALOR.includes('Error raised') && (
                                            <div
                                                style={{
                                                    marginTop: '4px',
                                                    padding: '6px',
                                                    backgroundColor: '#fee',
                                                    borderRadius: '3px',
                                                    fontSize: '12px',
                                                    color: '#d32f2f',
                                                }}
                                            >
                                                ⚠️ Erro encontrado
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div
                                style={{
                                    background: '#f6f8fa',
                                    padding: '16px',
                                    borderRadius: '4px',
                                    fontFamily: 'monospace',
                                    fontSize: '14px',
                                }}
                            >
                                <pre>{JSON.stringify(response, null, 2)}</pre>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {loading && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '10px' }}>
                        {getTranslation('Processing debug request...')}
                    </div>
                </div>
            )}
        </Modal>
        </>
    );
};

const mapStateToProps = (state: any): StateProps => ({
    loggedUser: state.loginReducer.loggedUser,
});

export default connect(mapStateToProps)(i18n(DoctorDebugModal)) as FC<Props>;
