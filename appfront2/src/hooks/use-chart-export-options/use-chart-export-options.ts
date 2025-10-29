import Highcharts from 'highcharts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { localeKeys } from '~/i18n';
import { ExportOption } from '~/modules/dashboard/sending-list/constants';
import { UseChartExportOptionsParams } from './interfaces';

export const useChartExportOptions = ({
  enableExport = true,
  exportOptions = [
    ExportOption.downloadPNG,
    ExportOption.downloadJPEG,
    ExportOption.downloadPDF,
    ExportOption.downloadSVG,
    ExportOption.downloadCSV,
    ExportOption.downloadXLS,
    ExportOption.printChart,
    ExportOption.viewData,
  ],
  filename,
}: UseChartExportOptionsParams = {}) => {
  const { t } = useTranslation();
  const useChartOptionsExportingLocaleKeys = localeKeys.hooks.useChartOptionsExporting;

  useEffect(() => {
    Highcharts.setOptions({
      lang: {
        loading: t(useChartOptionsExportingLocaleKeys.loading),
        contextButtonTitle: t(useChartOptionsExportingLocaleKeys.contextButtonTitle),
        decimalPoint: t(useChartOptionsExportingLocaleKeys.decimalPoint),
        thousandsSep: t(useChartOptionsExportingLocaleKeys.thousandsSep),
        downloadJPEG: t(useChartOptionsExportingLocaleKeys.downloadJPEG),
        downloadPDF: t(useChartOptionsExportingLocaleKeys.downloadPDF),
        downloadPNG: t(useChartOptionsExportingLocaleKeys.downloadPNG),
        downloadSVG: t(useChartOptionsExportingLocaleKeys.downloadSVG),
        downloadCSV: t(useChartOptionsExportingLocaleKeys.downloadCSV),
        downloadXLS: t(useChartOptionsExportingLocaleKeys.downloadXLS),
        printChart: t(useChartOptionsExportingLocaleKeys.printChart),
        exitFullscreen: t(useChartOptionsExportingLocaleKeys.exitFullscreen),
        viewFullscreen: t(useChartOptionsExportingLocaleKeys.viewFullscreen),
        hideData: t(useChartOptionsExportingLocaleKeys.hideData),
        viewData: t(useChartOptionsExportingLocaleKeys.viewData),
      },
    });
  }, [t, useChartOptionsExportingLocaleKeys]);

  const createExportMenu = (): string[] => {
    if (!exportOptions) return [];

    const allMenuItems: (ExportOption | 'separator')[] = [
      ExportOption.downloadPNG,
      ExportOption.downloadJPEG,
      ExportOption.downloadPDF,
      ExportOption.downloadSVG,
      'separator',
      ExportOption.downloadCSV,
      ExportOption.downloadXLS,
      'separator',
      ExportOption.viewData,
      ExportOption.printChart,
    ];

    const filteredItems: string[] = [];
    let lastWasSeparator = true;

    allMenuItems.forEach((item) => {
      if (item === 'separator') {
        if (!lastWasSeparator && filteredItems.length > 0) {
          filteredItems.push(item);
          lastWasSeparator = true;
        }
      } else if (exportOptions.includes(item)) {
        filteredItems.push(item);
        lastWasSeparator = false;
      }
    });

    if (filteredItems[filteredItems.length - 1] === 'separator') {
      filteredItems.pop();
    }

    return filteredItems;
  };

  return {
    credits: {
      enabled: false,
    },
    exporting: {
      enabled: enableExport,
      filename: filename?.replace(/\s+/g, '_').toLowerCase(),
      buttons: {
        contextButton: {
          menuItems: createExportMenu(),
        },
      },
    },
  };
};
