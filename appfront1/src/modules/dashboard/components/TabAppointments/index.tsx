import { Alert, Card, Col, message, Row, Space, Spin } from 'antd';
import axios, { CancelTokenSource } from 'axios';
import pick from 'lodash/pick';
import moment from 'moment';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { PageTemplate } from '../../../../shared-v2/page-template';
import DownloadModal from '../../../../shared/DownloadModal';
import { typeDownloadEnum } from '../../../../shared/DownloadModal/props';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { DashboardService } from '../../services/DashboardService';
import { HealthAnalyticsService } from '../../services/health-analytics.service';
import AppointmentFilter, { getDefaultFilter } from '../AppointmentFilter';
import { AppointmentFilterInterface } from '../AppointmentFilter/props';
import { AppointmentConfirmed, AppointmentPeriod, AppointmentStatus } from './appointment.interface';
import { PivotConfig } from './components/pivottable/props';
import SavedViews from './components/SavedViews';
import { TabAppointmentsProps } from './props';
const Pivottable = React.lazy(() => import('./components/pivottable'));

let cancelToken: CancelTokenSource | null = null;

const aliasToBackendField: Record<string, string> = {
    Unidades: 'organizationUnitName',
    Area_de_ocupacao: 'occupationAreaName',
    Tipo_de_agendamento: 'appointmentTypeName',
    Tipo_de_servico: 'typeOfServiceName',
    Convenio: 'insuranceName',
    Especialidade: 'specialityName',
    Procedimento: 'procedureName',
    Medico: 'doctorName',
    Plano_do_convenio: 'insurancePlanName',
    Sub_plano_do_convenio: 'insuranceSubPlanName',
    Categoria_do_convenio: 'insuranceCategoryName',
    Status_do_agendamento: 'appointmentStatus',
    Etapa: 'step',
    Data_Hora: 'timestamp',
    Motivo_nao_agendamento: 'reasonName',
    Motivo_nao_agendamento_observacao: 'reasonText',
    Url_conversa: 'conversationUrl',
    Periodo_do_dia: 'periodOfDay',
    Escolha_do_medico: 'chooseDoctor',
    Idade_do_paciente: 'patientAge',
    Canal: 'channelId',
    Codigo_do_agendamento: 'appointmentCode',
    Data_do_agendamento: 'appointmentDate',
    Codigo_do_paciente_ERP: 'patientCode',
    Codigo_localizacao_unidade: 'organizationUnitLocationName',
    Confirmacao_do_agendamento: 'appointmentConfirmed',
    Periodo_do_agendamento: 'appointmentPeriod',
    Status_lista_paciente: 'listPatientAppointmentStatus',
    Data_ultima_consulta_paciente: 'lastPatientAppointmentDate',
    Proxima_data_consulta_paciente: 'nextPatientAppointmentDate',
    Primeira_data_disponivel: 'firstAvaliableDate',
    Primeira_data_disponivel_retentativa: 'retryFirstAvaliableDate',
    Quantidade_datas_disponiveis: 'avaliableDateCount',
};

const TabAppointments: FC<TabAppointmentsProps & I18nProps> = ({ selectedWorkspace, getTranslation }) => {
    const [formattedData, setFormattedData] = useState<string[][]>([]);
    const [filter, setFilter] = useState<AppointmentFilterInterface>(getDefaultFilter(selectedWorkspace._id));
    const [loading, setLoading] = useState(true);
    const [isShowAlert, setIsShowAlert] = useState(false);
    const [initialConfigState, setInitialConfigState] = useState<PivotConfig | null>(null);
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const [pivotConfig, setPivotConfig] = useState<PivotConfig | null>(null);
    const [rawHeaders, setRawHeaders] = useState<string[]>([]);
    const [currentConfigBase64, setCurrentConfigBase64] = useState<string | null>(null);

    const pendingCb = (isPending: boolean) => setLoading(isPending);

    const generateCurrentConfigBase64 = useCallback(() => {
        try {
            if (!initialConfigState) return null;

            const params = pick(initialConfigState, [
                'aggregatorName',
                'colOrder',
                'cols',
                'rendererName',
                'rows',
                'valueFilter',
                'vals',
                'unusedOrientationCutoff',
                'tableOptions',
                'sorters',
                'rowOrder',
                'derivedAttributes',
            ]);

            const filters = pick(filter, ['startDate', 'endDate']);
            const configWithFilters = {
                ...params,
                filters
            };

            return window.btoa(JSON.stringify(configWithFilters));
        } catch (error) {
            console.error('Erro ao gerar base64 da configuração:', error);
            return null;
        }
    }, [initialConfigState, filter]);

    const loadSavedView = useCallback((configBase64: string) => {
        try {
            const decoded = JSON.parse(window.atob(configBase64));
            const { filters, ...configParams } = decoded;

            if (filters) {
                setFilter(filters);
            }

            if (configParams && Object.keys(configParams).length) {
                setInitialConfigState(configParams);
            }
        } catch (error) {
            console.error('Erro ao carregar visão salva:', error);
        }
    }, [setFilter, setInitialConfigState]);

    const handleResetFilters = useCallback(() => {
        setFilter(getDefaultFilter(selectedWorkspace._id));
        setInitialConfigState(null);
    }, [selectedWorkspace._id]);

    const formatData = useCallback(
        (key: string, value: any) => {
            if (!value && value !== 0) {
                return '';
            }
            const data = {
                appointmentStatus: () => {
                    let newValue = value;

                    switch (value) {
                        case AppointmentStatus.error:
                            newValue = 'erro';
                            break;
                        case AppointmentStatus.inProgress:
                            newValue = 'Agendamentos não concluídos';
                            break;
                        case AppointmentStatus.scheduled:
                            newValue = 'agendado';
                            break;
                        case AppointmentStatus.withoutSchedules:
                            newValue = 'sem horários';
                            break;
                        case AppointmentStatus.withoutEntities:
                            newValue = 'sem entidades';
                            break;
                        case AppointmentStatus.redirected:
                            newValue = 'Redirecionado pelo fluxo';
                            break;
                    }
                    return newValue;
                },
                appointmentConfirmed: () => {
                    let newValue = value;

                    switch (value) {
                        case AppointmentConfirmed.inProgress:
                            newValue = 'em progresso';
                            break;
                        case AppointmentConfirmed.notConfirmed:
                            newValue = 'não confirmado';
                            break;
                        case AppointmentConfirmed.confirmed:
                            newValue = 'confirmado';
                            break;
                    }
                    return newValue;
                },
                periodOfDay: () => {
                    let newValue = value;

                    switch (value) {
                        case 0:
                        case AppointmentPeriod.morning:
                            newValue = 'Manhã';
                            break;
                        case 1:
                        case AppointmentPeriod.afternoon:
                            newValue = 'Tarde';
                            break;
                        case 2:
                        case AppointmentPeriod.indifferent:
                            newValue = 'Indiferente';
                            break;
                    }
                    return newValue;
                },
                appointmentPeriod: () => {
                    let newValue = value;

                    switch (value) {
                        case AppointmentPeriod.morning:
                            newValue = 'manhã';
                            break;
                        case AppointmentPeriod.afternoon:
                            newValue = 'tarde';
                            break;
                        case AppointmentPeriod.indifferent:
                            newValue = 'indiferente';
                            break;
                    }
                    return newValue;
                },
                step: () => {
                    return getTranslation(value);
                },
                conversationUrl: () => {
                    return `https://app.botdesigner.io/live-agent?workspace=${selectedWorkspace._id}&conversation=${value}`;
                },
                lastPatientAppointmentDate: () => {
                    return moment(Number(value)).format('DD/MM/YYYY');
                },
                nextPatientAppointmentDate: () => {
                    return moment(Number(value)).format('DD/MM/YYYY - HH:mm');
                },
                appointmentDate: () => {
                    return moment(Number(value)).format('DD/MM/YYYY');
                },
                firstAvaliableDate: () => {
                    return moment(Number(value)).format('DD/MM/YYYY');
                },
                retryFirstAvaliableDate: () => {
                    return moment(Number(value)).format('DD/MM/YYYY');
                },
            };

            return data?.[key]?.() ?? value;
        },
        [getTranslation, selectedWorkspace._id]
    );

    const getFormattedData = useCallback(
        (appointments: any[]) => {
            if (!appointments || !appointments?.length) {
                setLoading(false);
                return setFormattedData([]);
            }

            const keys: string[] = Object.keys(appointments[0]);
            keys.push('conversationUrl');

            setRawHeaders(keys);

            const data: string[][] = [
                keys,
                ...appointments.map((item: any) => {
                    item = {
                        ...item,
                        conversationUrl: item?.conversationId,
                    };
                    return Object.values(pick<any>(item, keys)).map((value, index) => {
                        return formatData(keys[index], value);
                    });
                }),
            ];
            let keysTranslated = data;
            keysTranslated.splice(
                0,
                1,
                data[0].map((key) => getTranslation(key))
            );

            return setFormattedData(keysTranslated);
        },
        [formatData, getTranslation]
    );

    const loggedTimezone = loggedUser?.timezone;

    const normalizedFilter = React.useMemo(() => {
        const startDay = moment(filter.startDate).format('YYYY-MM-DD');
        const endDay = moment(filter.endDate).format('YYYY-MM-DD');
        const timezone = loggedTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

        return {
            ...filter,
            startDate: moment(startDay, 'YYYY-MM-DD').startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
            endDate: moment(endDay, 'YYYY-MM-DD').endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
            timezone,
        };
    }, [filter, loggedTimezone]);

    const getRawAppointments = useCallback(
        async (nf: AppointmentFilterInterface) => {
            if (cancelToken) {
                cancelToken.cancel();
            }

            setLoading(true);

            cancelToken = axios.CancelToken.source();
            const response = await HealthAnalyticsService.getAllData(
                selectedWorkspace._id as string,
                nf,
                cancelToken,
                () => {},
                pendingCb
            );

            getFormattedData(response);
        },
        [getFormattedData, pendingCb, selectedWorkspace._id]
    );

    const downloadAppointments = async (downloadType: string) => {
        const { rows = [], cols = [], valueFilter } = pivotConfig || {};

        const translatedToOriginalMap = formattedData[0].reduce((acc, translated, index) => {
            const rawHeader = rawHeaders[index];
            const normalizedHeader = aliasToBackendField[rawHeader] || rawHeader;
            acc[translated] = normalizedHeader;
            return acc;
        }, {} as Record<string, string>);

        const simplifiedPivotConfig = rows.concat(cols).map((translated) => translatedToOriginalMap[translated]);

        const pivotValueFilter = valueFilter
            ? Object.keys(valueFilter).reduce((acc, translatedKey) => {
                  const originalKey = translatedToOriginalMap[translatedKey] || translatedKey;
                  const currentFilter = valueFilter[translatedKey] || {};
                  const normalizedFilter = Object.entries(currentFilter).reduce<Record<string, boolean>>(
                      (valueAcc, [filterValue, shouldExclude]) => {
                          if (shouldExclude) {
                              valueAcc[filterValue] = true;
                          }
                          return valueAcc;
                      },
                      {}
                  );

                  if (Object.keys(normalizedFilter).length > 0) {
                      acc[originalKey] = normalizedFilter;
                  }

                  return acc;
              }, {} as Record<string, Record<string, boolean>>)
            : undefined;

        const newFilter: AppointmentFilterInterface = {
            ...filter,
            startDate: moment(filter.startDate).startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
            endDate: moment(filter.endDate).endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
            timezone: loggedUser.timezone,
            downloadType: downloadType === typeDownloadEnum.XLSX ? typeDownloadEnum.XLSX : typeDownloadEnum.CSV,
            pivotConfig: simplifiedPivotConfig,
            pivotValueFilter: pivotValueFilter && Object.keys(pivotValueFilter).length > 0 ? pivotValueFilter : undefined,
        };

        await DashboardService.downloadAppointments(selectedWorkspace._id, newFilter);
    };

    const handleSubmitFilter = (newFilter: AppointmentFilterInterface) => {
        const cloned: AppointmentFilterInterface = {
            ...newFilter,
            channelIds: Array.isArray(newFilter.channelIds) ? [...newFilter.channelIds] : [],
            teamIds: Array.isArray(newFilter.teamIds) ? [...newFilter.teamIds] : [],
            tags: Array.isArray(newFilter.tags) ? [...newFilter.tags] : [],
        };
        setFilter(cloned);
    };

    useEffect(() => {
        getRawAppointments(normalizedFilter);
    }, [normalizedFilter, selectedWorkspace._id]);

    useEffect(() => {
        return () => {
            if (cancelToken) {
                cancelToken.cancel();
            }
        };
    }, []);

    useEffect(() => {
        if (isShowAlert) {
            message.warning({
                content: getTranslation(
                    'It is not possible to group data for more than 2 months, as this may compromise table visualization.'
                ),
                duration: 5,
            });
        }
    }, [isShowAlert, getTranslation]);

    useEffect(() => {
        const configBase64 = generateCurrentConfigBase64();
        setCurrentConfigBase64(configBase64);
    }, [generateCurrentConfigBase64]);

    return (
        <PageTemplate>
            <Alert
                closable
                description={getTranslation(
                    'The PIVOT Table allows you to visualize details about each scheduling intent in the workspace. This report displays information only when the workspace has integrated automatic scheduling. If the scheduling process depends on an agent to be completed, the data will not be recorded in this table.'
                )}
                style={{ marginBottom: 16 }}
            />
            <Card
                className='no-title-padding-card'
                title={
                    <Row justify={'space-between'}>
                        <Col>
                            <AppointmentFilter
                                initialFilter={filter}
                                loading={loading}
                                selectedWorkspace={selectedWorkspace}
                                initialConfigState={initialConfigState}
                                setInitialConfigState={setInitialConfigState}
                                onSubmit={handleSubmitFilter}
                                setIsShowAlert={setIsShowAlert}
                            />
                        </Col>
                        <Col>
                            <Space>
                                <SavedViews
                                    currentViewConfig={currentConfigBase64}
                                    onLoadView={loadSavedView}
                                    onResetFilters={handleResetFilters}
                                    workspaceId={selectedWorkspace._id}
                                />
                                {formattedData?.length !== 0 && <DownloadModal onDownload={downloadAppointments} />}
                            </Space>
                        </Col>
                    </Row>
                }
            >
                <React.Suspense fallback={<div>Loading..</div>}>
                    <Spin spinning={loading} tip={`${getTranslation('Loading')}...`}>
                        <Pivottable
                            data={formattedData}
                            filter={filter}
                            setFilter={setFilter}
                            initialConfigState={initialConfigState}
                            setInitialConfigState={setInitialConfigState}
                            onChangeConfig={setPivotConfig}
                        />
                    </Spin>
                </React.Suspense>
            </Card>
        </PageTemplate>
    );
};

export default i18n(TabAppointments);
