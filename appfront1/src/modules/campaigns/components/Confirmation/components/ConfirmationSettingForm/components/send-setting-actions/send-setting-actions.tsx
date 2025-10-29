import { Button, Col, DatePicker, Form, Input, message, Modal, Popover, Row, Select, Space, Table, Tooltip } from 'antd';
import moment from 'moment-timezone';
import { useEffect, useState } from 'react';
import ReactJson from 'react-json-view';
import { useLanguageContext } from '../../../../../../../i18n/context';
import { useFetchExtractions, useListExtractData, useManualExtraction } from '../../hooks/use-extractions';
import { FormValues, SendSettingActionsProps, ConsultFlowFormValues, ConsultFlowTrigger, TypeOnSubmit } from './interfaces';
import { useConsultFlowData } from '../../hooks/use-extractions/use-extractions';
const { RangePicker } = DatePicker;

export const SendSettingActions = (props: SendSettingActionsProps) => {
    const { getTranslation } = useLanguageContext();
    const [form] = Form.useForm<FormValues>();
    const { selectedWorkspace, formik, title, children, type } = props;

    const [activePopover, setActivePopover] = useState<TypeOnSubmit | null>(null);
    const [isTableModalVisible, setIsTableModalVisible] = useState(false);
    const [isJsonModalVisible, setIsJsonModalVisible] = useState(false);
    const [isFlowJsonModalVisible, setIsFlowJsonModalVisible] = useState(false);
    const [startDate, setStartDate] = useState<string>(moment().startOf('day').toISOString());
    const [endDate, setEndDate] = useState<string>(moment().endOf('day').toISOString());
    const [typeOnSubmit, setTypeOnSubmit] = useState<TypeOnSubmit | undefined>(undefined);
    const [loadingListExtractions, setLoadingListExtractions] = useState(false);
    const showButtonConsultFlow = title === 'Confirmation Settings';
    const [formConsultFlow, setFormConsultFlow] = useState<ConsultFlowFormValues>({
        scheduleIds: [],
        trigger: ConsultFlowTrigger.active_confirmation_confirm
    })

    const { runManualExtraction, loading: loadingManualExtraction } = useManualExtraction(
        selectedWorkspace._id,
        type,
        formik.values.schedule?.id
    );
    
    const {
        fetchExtractions,
        extractions,
        loading: loadingExtractions,
    } = useFetchExtractions(selectedWorkspace._id, formik.values.schedule?.id);
    const {
        listExtractData,
        jsonData,
        loading: loadingExtractData,
    } = useListExtractData(selectedWorkspace._id, type, formik.values.schedule?.id);

    const {
        consultFlowData,
        jsonFlowData,
        loading: loadingConsultFlow,
    } = useConsultFlowData(selectedWorkspace._id, formConsultFlow, formik.values.schedule?.integrationId);

    const handleOpenChange = (open: boolean, type: TypeOnSubmit) => {
        setActivePopover(open ? type : null);
    };

    const handleCancel = () => {
        setIsTableModalVisible(false);
        setIsJsonModalVisible(false);
        setIsFlowJsonModalVisible(false);
    };

    const handleDateChange = (dates: any) => {
        if (dates) {
            setStartDate(moment(dates[0]).startOf('day').toISOString());
            setEndDate(moment(dates[1]).endOf('day').toISOString());
        }
    };

    const handleSubmit = async () => {
        setActivePopover(null);

        if (typeOnSubmit === TypeOnSubmit.consultFlow) {
            await consultFlowData();
            setIsFlowJsonModalVisible(true);
            return;
        }

        const selectedDates = form.getFieldValue('date');

        if (!selectedDates || selectedDates.length !== 2) {
            message.warning('Por favor, selecione um intervalo de datas.');
            return;
        }
        if (!formik.values.schedule?.id) return;

        if (typeOnSubmit === TypeOnSubmit.runManualExtraction) {
            await runManualExtraction(startDate, endDate);
            await fetchExtractions();
            setIsTableModalVisible(true);
        }
        if (typeOnSubmit === TypeOnSubmit.listDiagnosticExtractions) {
            await listExtractData(startDate, endDate);
            setIsJsonModalVisible(true);
        }
    };

    const handleListExtractions = async () => {
        setLoadingListExtractions(true);
        await fetchExtractions();
        setLoadingListExtractions(false);
        setIsTableModalVisible(true);
    };

    useEffect(() => {
        form.resetFields(['date']);
    }, [form, typeOnSubmit]);

    const popoverContent = (
        <Space align='center'>
            <Form form={form} layout='inline'>
                <Form.Item
                    name='date'
                    rules={[
                        {
                            required: true,
                            message: '',
                        },
                    ]}
                >
                    <RangePicker onChange={handleDateChange} />
                </Form.Item>
                <Form.Item>
                    <Button className='antd-span-default-color' type='primary' onClick={handleSubmit}>
                        Confirmar
                    </Button>
                </Form.Item>
            </Form>
        </Space>
    );

    const popoverconsultFlowContent = (
        <Space align='center' size={'small'}>
            <Form layout='vertical' style={{width: '200px'}}>
                <Form.Item
                    name='trigger'
                    rules={[
                        {
                            required: true,
                            message: '',
                        },
                    ]}
                >
                    <Select
                        placeholder='Gatilho'
                        value={formConsultFlow?.trigger}
                        style={{ width: '100%' }}
                        options={[
                            {
                                label: 'Confirmadas',
                                value: ConsultFlowTrigger.active_confirmation_confirm
                            },
                            {
                                label: 'Cancelada',
                                value: ConsultFlowTrigger.active_confirmation_cancel
                            }
                        ]}
                        onChange={(value) => {
                            setFormConsultFlow((prev) => ({
                                ...prev,
                                trigger: value as ConsultFlowTrigger,
                            }));
                        }}
                    />
                </Form.Item>
                <Form.Item
                    name='scheduleIds'
                    rules={[
                        {
                            required: true,
                            message: '',
                        },
                    ]}
                    style={{
                        width: '100%'
                    }}
                >
                   <Select
                        mode='tags'
                        placeholder='scheduleIds'
                        value={formConsultFlow?.scheduleIds}
                        style={{ width: '100%' }}
                        options={[]}
                        onChange={(value) => {
                            setFormConsultFlow((prev) => ({
                                ...prev as any,
                                scheduleIds: value,
                            }));
                        }}
                        
                    />
                </Form.Item>
                <Form.Item>
                    <Button className='antd-span-default-color' type='primary' onClick={handleSubmit}>
                        Confirmar
                    </Button>
                </Form.Item>
            </Form>
        </Space>
    );

    return (
        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Col>{getTranslation(title)}</Col>
            <Col>
                <Space>
                    <Button
                        disabled={!formik.values.schedule?.id}
                        onClick={handleListExtractions}
                        className='antd-span-default-color'
                        type='default'
                        size='small'
                        loading={loadingListExtractions}
                    >
                        Listar extrações
                    </Button>

                    {showButtonConsultFlow &&
                        <Popover
                            content={popoverconsultFlowContent}
                            title='Informe os dados necessários'
                            trigger='click'
                            open={activePopover === TypeOnSubmit.consultFlow}
                            onOpenChange={(open) => handleOpenChange(open, TypeOnSubmit.consultFlow)}
                        >
                            <Button
                                disabled={!formik.values.schedule?.id}
                                onClick={() => setTypeOnSubmit(TypeOnSubmit.consultFlow)}
                                className='antd-span-default-color'
                                type='default'
                                size='small'
                                loading={loadingConsultFlow}
                            >
                                Consultar flows
                            </Button>
                        </Popover>
                    }

                    <Popover
                        content={popoverContent}
                        title='Selecionar Datas'
                        trigger='click'
                        open={activePopover === TypeOnSubmit.runManualExtraction}
                        onOpenChange={(open) => handleOpenChange(open, TypeOnSubmit.runManualExtraction)}
                    >
                        <Button
                            disabled={!formik.values.schedule?.id}
                            onClick={() => setTypeOnSubmit(TypeOnSubmit.runManualExtraction)}
                            className='antd-span-default-color'
                            type='default'
                            size='small'
                            loading={loadingManualExtraction || loadingExtractions}
                        >
                            Rodar extração manualmente
                        </Button>
                    </Popover>
                    
                    <Popover
                        content={popoverContent}
                        title='Selecionar Datas'
                        trigger='click'
                        open={activePopover === TypeOnSubmit.listDiagnosticExtractions}
                        onOpenChange={(open) => handleOpenChange(open, TypeOnSubmit.listDiagnosticExtractions)}
                    >
                        <Button
                            disabled={!formik.values.schedule?.id}
                            onClick={() => setTypeOnSubmit(TypeOnSubmit.listDiagnosticExtractions)}
                            className='antd-span-default-color'
                            type='default'
                            size='small'
                            loading={loadingExtractData}
                        >
                            Visualizar dados de listagem
                        </Button>
                    </Popover>
                    {!!children ? <Col style={{ marginRight: 5 }}>{children}</Col> : null}
                </Space>
            </Col>
            <Modal
                width={'90vw'}
                title='Extrações'
                open={isTableModalVisible}
                onCancel={handleCancel}
                footer={null}
                bodyStyle={{ padding: 0 }}
            >
                <Table
                    bordered
                    dataSource={extractions}
                    columns={
                        extractions.length > 0
                            ? Object.keys(extractions[0]).map((key) => {
                                  const hasData = extractions.some((item) => item[key]);

                                  return {
                                      title: (
                                          <Tooltip title={key.charAt(0).toUpperCase() + key.slice(1)}>
                                              {key.charAt(0).toUpperCase() + key.slice(1)}
                                          </Tooltip>
                                      ),

                                      dataIndex: key,
                                      key,
                                      width: hasData ? undefined : key.length * 10 + 20,
                                      onHeaderCell: () => ({
                                          style: { whiteSpace: 'nowrap' },
                                      }),
                                  };
                              })
                            : []
                    }
                    rowKey='id'
                    scroll={{
                        x: 'max-content',
                        y: 'calc(80vh - 180px)',
                    }}
                    pagination={false}
                />
            </Modal>

            <Modal
                width={'90vw'}
                title='Dados da Extração'
                open={isJsonModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                <ReactJson src={jsonData || {}} theme='monokai' collapsed={false} />
            </Modal>

            <Modal
                width={'90vw'}
                title='Dados da Consulta flow'
                open={isFlowJsonModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                <ReactJson src={jsonFlowData || {}} theme='monokai' collapsed={false} />
            </Modal>
        </Row>
    );
};
