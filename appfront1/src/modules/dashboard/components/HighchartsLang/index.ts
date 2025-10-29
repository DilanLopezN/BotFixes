import moment from 'moment';
import Highcharts from 'highcharts';
import { UserLanguage } from 'kissbot-core';

const setHighchartsLang = (language?: UserLanguage) => {
    if (language === UserLanguage.pt) {
        Highcharts.setOptions({
            lang: {
                months: moment.months(),
                shortMonths: moment.monthsShort(),
                weekdays: moment.weekdays(),
                loading: 'Carregando...',
                contextButtonTitle: 'Exportar gráfico',
                decimalPoint: ',',
                thousandsSep: '.',
                downloadJPEG: 'Baixar imagem JPEG',
                downloadPDF: 'Baixar arquivo PDF',
                downloadPNG: 'Baixar imagem PNG',
                downloadSVG: 'Baixar vetor SVG',
                downloadCSV: 'Baixar arquivo CSV',
                downloadXLS: 'Baixar arquivo XLS',
                printChart: 'Imprimir gráfico',
                rangeSelectorFrom: 'De',
                rangeSelectorTo: 'Para',
                rangeSelectorZoom: 'Zoom',
                resetZoom: 'Limpar Zoom',
                resetZoomTitle: 'Voltar Zoom para nível 1:1',
                exitFullscreen: 'Sair da tela cheia',
                viewFullscreen: 'Ver em tela cheia',
                hideData: 'Esconder dados',
                viewData: 'Ver tabela',
            },
        });
    } else {
        Highcharts.setOptions({
            lang: {
                months: moment.months(),
                shortMonths: moment.monthsShort(),
                weekdays: moment.weekdays(),
                loading: 'Loading...',
                contextButtonTitle: 'Export Chart',
                decimalPoint: '.',
                thousandsSep: ',',
                downloadJPEG: 'Download JPEG Image',
                downloadPDF: 'Download PDF File',
                downloadPNG: 'Download PNG Image',
                downloadSVG: 'Download SVG Vector',
                downloadCSV: 'Download CSV File',
                downloadXLS: 'Download XLS File',
                printChart: 'Print Chart',
                rangeSelectorFrom: 'From',
                rangeSelectorTo: 'To',
                rangeSelectorZoom: 'Zoom',
                resetZoom: 'Reset Zoom',
                resetZoomTitle: 'Reset Zoom Level 1:1',
                exitFullscreen: 'Exit Fullscreen',
                viewFullscreen: 'View Fullscreen',
                hideData: 'Hide Data',
                viewData: 'View Table',
            },
        });
    }
};

export default setHighchartsLang;
