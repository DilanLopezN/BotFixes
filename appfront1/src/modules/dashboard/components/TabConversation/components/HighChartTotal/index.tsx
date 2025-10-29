import axios, { CancelTokenSource } from 'axios';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import moment from 'moment';
import { FC, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Team } from '../../../../../../model/Team';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { ApiConversationFilter, DashboardService } from '../../../../services/DashboardService';
import { ConversationFilterIntervalsHour } from '../../../ConversationFilter';
import SelectInterval from '../../../SelectInterval';

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

const HighChartTotal: FC<HighChartTotalProps & I18nProps> = ({ filter, teams, getTranslation, onLoading }) => {
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const [selectedInterval, setSelectedInterval] = useState<string>(ConversationFilterIntervalsHour.days.key);
    const [loading, setLoading] = useState(true);
    const chartComponent = useRef<any>();
    let array: string[] = [];

    teams.map((team) => {
        team.roleUsers.map((user) => {
            array.push(user.userId);
        });
    });
    let closedBy = array.filter((id, index) => array.indexOf(id) === index);

    const pendingCb = (isPending: boolean): any => {
        if (isPending) {
            setLoading(true);
        } else {
            setLoading(false);
        }
    };

    const getChartOptions = async () => {
        let title,
            xAxisCategory: any[] = [],
            dataSeries: any[] = [];
        let err: any;
        let intervalLabel;

        if (cancelToken) {
            cancelToken.cancel();
        }

        cancelToken = axios.CancelToken.source();
        const analytics = await DashboardService.getConversationsAnalytics(
            {
                ...filter,
                timezone: loggedUser.timezone,
                interval: selectedInterval as any,
                groupBy: 'total',
                closedBy: closedBy,
            },
            cancelToken,
            (responseError) => (err = responseError),
            pendingCb
        );

        switch (selectedInterval) {
            case ConversationFilterIntervalsHour.hours.key: {
                intervalLabel = 'DD/MM/YYYY HH:mm';
                break;
            }
            case ConversationFilterIntervalsHour.weeks.key:
            case ConversationFilterIntervalsHour.days.key: {
                intervalLabel = 'dddd DD/MM/YY';
                break;
            }
            case ConversationFilterIntervalsHour.months.key: {
                intervalLabel = 'MMMM';
                break;
            }
        }
        if (analytics && analytics.length) {
            analytics.map((data) => {
                dataSeries.push(data.count);
                if (selectedInterval === ConversationFilterIntervalsHour.hours.key) {
                    xAxisCategory.push(moment(data.date).utc(true).format(intervalLabel));
                } else {
                    xAxisCategory.push(moment(data.date).utc().format(intervalLabel));
                }
            });

            const chart = chartComponent.current?.chart;
            chart?.hideLoading();
        } else {
            const chart = chartComponent.current?.chart;
            chart?.showLoading(`${getTranslation('No Data')}`);
        }

        const options: Highcharts.Options = {
            title: { text: getTranslation('Total') },
            xAxis: { categories: xAxisCategory },
            yAxis: { title: { text: '' } },
            plotOptions: {
                series: {
                    animation: { duration: 1000 },
                    dataLabels: {
                        enabled: true,
                        style: { fontWeight: 'normal' },
                        formatter: function () {
                            return `${this.y}`;
                        },
                    },
                },
            },
            tooltip: {
                formatter: function () {
                    return `${this.x} <br /> ${this.y} ${getTranslation('Conversations')}`;
                },
                shared: true,
            },
            series: [
                {
                    name: getTranslation('Conversation total'),
                    type: 'spline',
                    data: dataSeries,
                },
            ],
        };

        return options;
    };
    const [chartOptions, setChartOptions] = useState<any>({});

    const getAnalytics = async () => {
        const chartOptions = await getChartOptions();
        setChartOptions(chartOptions);
    };

    useEffect(() => {
        const chart = chartComponent.current?.chart;
        chart?.showLoading(`${getTranslation('Loading')}...`);

        getAnalytics();
    }, [filter, selectedInterval]);

    useEffect(() => {
        onLoading(loading);
    }, [loading, onLoading]);

    useEffect(() => {
        return () => {
            if (cancelToken) {
                cancelToken.cancel();
            }
        };
    }, []);

    return (
        <Wrapper id='chart-HighChartTotal'>
            <div style={{ position: 'relative' }}>
                <Wrapper
                    maxWidth='200px'
                    minWidth='200px'
                    position='absolute'
                    style={{ zIndex: 1 }}
                    title={getTranslation('Select a period to view on the chart.')}
                >
                    <SelectInterval
                        defaultValue={selectedInterval}
                        onChange={setSelectedInterval}
                        tabConversationTotal
                    />
                </Wrapper>
            </div>

            <HighchartsReact highcharts={Highcharts} options={chartOptions} ref={chartComponent} />
        </Wrapper>
    );
};

export interface HighChartTotalProps {
    filter: ApiConversationFilter;
    teams: Team[];
    onLoading: Function;
}

export default i18n(HighChartTotal) as FC<HighChartTotalProps>;
