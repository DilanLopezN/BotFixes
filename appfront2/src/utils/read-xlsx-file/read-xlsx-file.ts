import { RcFile } from 'antd/es/upload';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import * as XLSX from 'xlsx';
import { convertExcelPatternToDayjs } from './convert-xlsx-format-to-day-js';
import { getFormattedDate } from './get-formatted-date';

export const readXlsxFile = (file: RcFile, callback: (sheet: any[][]) => void) => {
  const reader = new FileReader();
  reader.onload = (e: ProgressEvent<FileReader>) => {
    const arrayBuffer = e.target?.result as ArrayBuffer;
    const data = new Uint8Array(arrayBuffer);
    const binaryStr = data.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    const workbook = XLSX.read(binaryStr, {
      type: 'binary',
      cellNF: true,
    });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const formattedWorksheet = Object.keys(worksheet).reduce((previousValue, currentValue) => {
      const selectedCell = worksheet[currentValue];

      if (
        currentValue[0] === '!' ||
        selectedCell.t !== 'n' ||
        (selectedCell.t === 'n' && selectedCell.z === 'General')
      ) {
        return { ...previousValue, [currentValue]: selectedCell };
      }

      if (selectedCell.t === 'n' && selectedCell.z === '@') {
        return { ...previousValue, [currentValue]: { ...selectedCell, w: String(selectedCell.v) } };
      }

      const patternObj = convertExcelPatternToDayjs(selectedCell.z);

      if (patternObj) {
        dayjs.locale(patternObj.language);
      }

      const decodedDate = XLSX.SSF.parse_date_code(selectedCell.v);

      if (!decodedDate) {
        return { ...previousValue, [currentValue]: selectedCell };
      }

      const formattedDate = dayjs()
        .set('year', decodedDate.y)
        .set('month', decodedDate.m - 1)
        .set('date', decodedDate.d)
        .set('hour', decodedDate.H)
        .set('minute', decodedDate.M)
        .set('second', decodedDate.S);

      const formattedValue = patternObj
        ? formattedDate.format(patternObj.pattern)
        : getFormattedDate(formattedDate);

      return { ...previousValue, [currentValue]: { ...selectedCell, w: formattedValue } };
    }, {});

    const sheetData: any[][] = XLSX.utils.sheet_to_json(formattedWorksheet, {
      header: 1,
      raw: false,
      // defval: '',
    });

    const filteredSheetData = sheetData.filter((sheet) => Boolean(sheet.length));

    callback(filteredSheetData);
  };
  reader.readAsArrayBuffer(file);
};
