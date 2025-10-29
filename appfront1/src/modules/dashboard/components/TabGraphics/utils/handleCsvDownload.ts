import moment from 'moment';
import { ChartType } from '../interfaces/conversation-template-interface';

const { Parser } = require('json2csv');

export const handleCsvDownloadChart = (options, name, type?: ChartType) => {
    try {
        let result: any[] = [];

        options.xAxis.categories.forEach((date, index) => {
            result.push({
                Periodo: date,
            });

            if (type && type === ChartType.pizza) {
                options.series[0].data.forEach((element) => {
                    result.splice(index, 1, {
                        ...result[index],
                        [`${element.name}`]: `${moment
                            .duration(element.y || 0, 'milliseconds')
                            .format('d[d] hh:mm:ss', { forceLength: true, stopTrim: 'h' })}`,
                    });
                });
            } else {
                options.series.forEach((serie) => {
                    result.splice(index, 1, {
                        ...result[index],
                        [`${serie.name}`]: `${
                            serie.data[index] !== null
                                ? moment
                                      .duration(serie.data[index] || 0, 'milliseconds')
                                      .format('d[d] hh:mm:ss', { forceLength: true, stopTrim: 'h' })
                                : ''
                        }`,
                    });
                });
            }
        });

        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(result);

        const linkElement = document.createElement('a');

        linkElement.download = `${name || 'gráfico'}.csv`;
        linkElement.href = `data:text/csv;content-disposition:attachment;base64,${btoa(
            unescape(encodeURIComponent(csv))
        )}`;

        document.body.appendChild(linkElement);

        linkElement.click();
        linkElement.remove();
    } catch (err) {
        console.log('error download csv chart', err);
    }
};

export const handleCsvDownloadTable = (template, columns, dataSource) => {
    try {
        if (!dataSource.length) return;

        let result: any[] = [];

        dataSource.forEach((data) => {
            let row = {};
            delete data.key;
            Object.keys(data).forEach((key) => {
                const columnName = columns.find((column) => column.dataIndex === key)?.title;
                row[columnName] = data[key];
            });
            result.push(row);
        });

        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(result);

        const linkElement = document.createElement('a');

        linkElement.download = `${template.name || 'gráfico'}.csv`;
        linkElement.href = `data:text/csv;content-disposition:attachment;base64,${btoa(
            unescape(encodeURIComponent(csv))
        )}`;

        document.body.appendChild(linkElement);

        linkElement.click();
        linkElement.remove();
    } catch (err) {
        console.log('error download csv table', err);
    }
};
export const handleCsvAgroupedDownloadTable = (template, columns, dataSource) => {
    try {
        if (!dataSource.length) return;
        let result: { [key: string]: any; Data: string; Métrica: any }[] = [];
        let currentCategoty: any = '';

        dataSource.forEach((data) => {
            delete data.key;

            Object.entries(data).forEach(([key, value]) => {
                if (key === 'groupField') {
                    currentCategoty = value;
                }
                if (key !== 'groupField') {
                    const columnDate = key === 'key' ? 'Agente' : key;
                    const formattedDate = new Date(columnDate);
                    const options: Intl.DateTimeFormatOptions = {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    };

                    const formattedDateString = new Intl.DateTimeFormat('pt-BR', options).format(formattedDate);

                    const dynamicPropertyName = columns[0].title;
                    const entry = {
                        [dynamicPropertyName]: currentCategoty,
                        Data: formattedDateString,
                        Métrica: value,
                    };
                    result.push(entry);
                }
            });
        });

        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(result);

        const linkElement = document.createElement('a');

        linkElement.download = `${template.name || 'gráfico'}.csv`;
        linkElement.href = `data:text/csv;content-disposition:attachment;base64,${btoa(
            unescape(encodeURIComponent(csv))
        )}`;

        document.body.appendChild(linkElement);

        linkElement.click();
        linkElement.remove();
    } catch (err) {
        console.log('error download csv table', err);
    }
};
