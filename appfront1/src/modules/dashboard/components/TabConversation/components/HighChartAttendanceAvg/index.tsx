import React, { FC, useEffect, useRef, useState } from 'react';
import { ApiConversationFilter, DashboardService } from '../../../../services/DashboardService';
import { ConversationFilterIntervals } from '../../../ConversationFilter';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import i18n from '../../../../../i18n/components/i18n';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import moment from 'moment';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import SelectInterval from '../../../SelectInterval';
import { useSelector } from 'react-redux';
import axios, { CancelTokenSource } from 'axios';

Highcharts.setOptions({
    credits: {
        enabled: false,
    },
});

require('highcharts/modules/exporting')(Highcharts);
require('highcharts/modules/data')(Highcharts);
require('highcharts/modules/export-data')(Highcharts);
require('highcharts/modules/offline-exporting')(Highcharts);
let cancelToken: CancelTokenSource | null = null;

const HighChartAttendanceAvg: FC<HighChartAttendanceAvgProps & I18nProps> = ({ filter, getTranslation, onLoading }) => {
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const [selectedInterval, setSelectedInterval] = useState<string>(ConversationFilterIntervals.days.key);
    const [showDataTable, setShowDataTable] = useState(false);

    const chartComponent = useRef<any>();
    const observeRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        const chart = chartComponent.current?.chart;
        chart?.showLoading(`${getTranslation('Loading')}...`);
        return () => {
            if (cancelToken) {
                cancelToken.cancel();
            }
        };
    }, []);

    useEffect(() => {
        if (chartOptions) {
            setChartOptions({
                ...chartOptions,
                exporting: {
                    ...chartOptions.exporting,
                    menuItemDefinitions: {
                        ...chartOptions.exporting?.menuItemDefinitions,
                        viewData: {
                            ...chartOptions.exporting?.menuItemDefinitions.viewData,
                            text: showDataTable ? 'Esconder tabela' : 'Ver tabela',
                            onclick: () => setShowDataTable(!showDataTable),
                        },
                    },
                },
            });
        }
    }, [showDataTable]);

    const getChartOptions = async () => {
        if (cancelToken) {
            cancelToken.cancel();
        }
        cancelToken = axios.CancelToken.source();
        const analytics = await DashboardService.getConversationsAnalytics(
            {
                ...filter,
                timezone: loggedUser.timezone,
                interval: selectedInterval as any,
                groupBy: 'attendance-date-avg',
            },
            cancelToken
        );

        onLoading(false);

        let title,
            xAxisCategory: any[] = [],
            dataSeries: any[] = [];
        let intervalLabel;
        switch (selectedInterval) {
            case ConversationFilterIntervals.weeks.key:
            case ConversationFilterIntervals.days.key: {
                intervalLabel = 'dddd DD/MM/YY';
                break;
            }
            case ConversationFilterIntervals.months.key: {
                intervalLabel = 'MMMM';
                break;
            }
        }
        if (analytics && analytics.length) {
            analytics.map((data) => {
                dataSeries.push(data.avg);
                xAxisCategory.push(moment(data.date).utc().format(intervalLabel));
            });

            const chart = chartComponent.current?.chart;
            chart?.hideLoading();
        } else {
            const chart = chartComponent.current?.chart;
            chart?.showLoading(`${getTranslation('No Data')}`);
        }

        const options: Highcharts.Options = {
            title: {
                text: getTranslation('Average agent first response time'),
                x: 80,
                widthAdjust: -200,
            },
            xAxis: { categories: xAxisCategory },
            yAxis: {
                title: { text: '' },
                labels: {
                    formatter: function () {
                        return moment
                            .duration(this.value || 0, 'milliseconds')
                            .format('d[d] hh:mm:ss', { forceLength: true, stopTrim: 'h' });
                    },
                },
            },
            exporting: {
                menuItemDefinitions: {
                    downloadCSV: {
                        onclick: () => handleCsvDownload(options),
                        text: 'Baixar arquivo CSV',
                    },
                    viewData: {
                        onclick: () => setShowDataTable(!showDataTable),
                        text: 'Ver tabela',
                    },
                },
                buttons: {
                    contextButton: {
                        menuItems: [
                            'viewFullscreen',
                            'printChart',
                            'separator',
                            'downloadPNG',
                            'downloadJPEG',
                            'downloadPDF',
                            'downloadSVG',
                            'separator',
                            'downloadCSV',
                            'viewData',
                        ],
                    },
                },
            },
            plotOptions: {
                series: {
                    animation: { duration: 1000 },
                    dataLabels: {
                        enabled: true,
                        style: { fontWeight: 'normal' },
                        formatter: function () {
                            return `${moment
                                .duration(this.y || 0, 'milliseconds')
                                .format('d[d] hh:mm:ss', { forceLength: true, stopTrim: 'h' })}`;
                        },
                    },
                },
            },
            tooltip: {
                formatter: function () {
                    return `<br />${this.x} <br /> ${getTranslation('Average agent first response time')}: ${moment
                        .duration(this.y || 0, 'milliseconds')
                        .format('d[d] hh:mm:ss', { forceLength: true, stopTrim: 'h' })}`;
                },
                shared: true,
            },
            series: [
                {
                    name: getTranslation('Average agent first response time'),
                    type: 'spline',
                    data: dataSeries,
                },
            ],
        };

        return options;
    };

    const [chartOptions, setChartOptions] = useState<any>({});

    useEffect(() => {
        const chartElement = document.getElementById('chart-HighChartAttendanceAvg');

        if (chartElement) {
            observeRef.current?.disconnect();
            observeRef.current = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.intersectionRatio > 0) {
                        getAnalytics();
                        observer.disconnect();
                    }
                });
            });
            observeRef.current.observe(chartElement);
        } else {
            getAnalytics();
        }
    }, [filter, selectedInterval]);

    const getAnalytics = async () => {
        onLoading(true);

        const chart = chartComponent.current?.chart;
        chart?.showLoading(`${getTranslation('Loading')}...`);
        const chartOptions = await getChartOptions();
        setChartOptions(chartOptions);
    };

    const handleCsvDownload = (options) => {
        const firstLetterUppercase = (string) => {
            return string.charAt(0).toUpperCase() + string.slice(1);
        };

        const columnCsv = options.xAxis.categories.map((obj, index) => {
            return `${index === 0 ? ',' : ''}${firstLetterUppercase(obj)}, ${moment
                .duration(options.series[0].data?.[index] || 0, 'milliseconds')
                .format('d[d] hh:mm:ss', { forceLength: true, stopTrim: 'h' })}\r\n`;
        });

        let content = `,${getTranslation('Date')}, ${getTranslation(
            'Average agent first response time'
        )}\r\n ${columnCsv}\r\n`;

        const linkElement = document.createElement('a');

        linkElement.download = `tempo-medio-resposta-histograma.csv`;
        linkElement.href = `data:text/csv;content-disposition:attachment;base64,${btoa(
            unescape(encodeURIComponent(content))
        )}`;

        document.body.appendChild(linkElement);

        linkElement.click();
        linkElement.remove();
    };

    return (
        <Wrapper id='chart-HighChartAttendanceAvg'>
            <div style={{ position: 'relative' }}>
                <Wrapper
                    maxWidth='200px'
                    minWidth='200px'
                    position='absolute'
                    style={{ zIndex: 1 }}
                    title={getTranslation('Select a period to view on the chart.')}
                >
                    <SelectInterval defaultValue={selectedInterval} onChange={setSelectedInterval} />
                </Wrapper>
            </div>
            <HighchartsReact highcharts={Highcharts} options={chartOptions} ref={chartComponent} />
            {chartOptions && showDataTable && (
                <Wrapper flexBox flexDirection='column'>
                    <Wrapper flexBox>
                        <Wrapper flexBox flexDirection='column'>
                            <b>{getTranslation('Date')}</b>
                            {chartOptions.xAxis.categories.map((e) => {
                                return <b>{e}</b>;
                            })}
                        </Wrapper>
                        <Wrapper flexBox flexDirection='column'>
                            <b>{getTranslation('Average agent first response time')}</b>
                            {chartOptions.series[0].data.map((e) => {
                                return (
                                    <span>
                                        {moment
                                            .duration(e || 0, 'milliseconds')
                                            .format('d[d] hh:mm:ss', { forceLength: true, stopTrim: 'h' })}
                                    </span>
                                );
                            })}
                        </Wrapper>
                    </Wrapper>
                </Wrapper>
            )}
        </Wrapper>
    );
};

export interface HighChartAttendanceAvgProps {
    filter: ApiConversationFilter;
    onLoading: Function;
}

export default i18n(HighChartAttendanceAvg) as FC<HighChartAttendanceAvgProps>;
