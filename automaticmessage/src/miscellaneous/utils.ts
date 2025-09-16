import * as moment from 'dayjs';
const XLSX = require('xlsx');
import { Parser } from 'json2csv';
import { createGzip } from 'zlib';

export const isValidPhone = (phone: string): boolean => {
  // Regex para validar telefones (exemplo: números com 8 ou mais dígitos)
  const phoneRegex = /^\d{8,16}$/;
  return phoneRegex.test(phone);
};

export const isValidEmail = (email: string): boolean => {
  // Regex para validar email (validações conforme o RFC 5322)
  const emailRegex =
    /^(?!\.)"?(?=[^"]*?$)(?![.])(?!.*[.]{2})(?![.]{2})(?!.*\.[.])(?:(?:[a-zA-Z0-9!#$%&'*+=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+=?^_`{|}~-]+)*|\"(?:[^\"]|\\\")*\")@(?:(?!-)[A-Za-z0-9-]{1,63}(?=-)[A-Za-z0-9-]{0,63}|[A-Za-z0-9-]{1,63})\.(?!-)(?:[A-Za-z0-9-]{2,})|(\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\]))$/;
  return emailRegex.test(email);
};

export const getCompletePhone = (phone: string, ddi: string = '55') => {
  //Tratamento para o brasil
  if (ddi === '55') {
    if (phone.startsWith('0800')) {
      return `${ddi}${phone.slice(1)}`;
    }
    if (phone.startsWith('550800')) {
      return `${ddi}${phone.slice(3)}`;
    }
    // Se é com dd com ou sem 9
    if (phone.length === 11 || phone.length === 10) {
      return `${ddi}${phone}`;
    }
    return phone;
  }
  // Outros países
  return `${ddi}${phone}`;
};

export const shouldRunCron = () => {
  return process.env.NODE_ENV == 'local' || process.env.START_TYPE === 'batch';
};

export const shouldStartKafka = () => {
  return process.env.NODE_ENV == 'local' || process.env.START_TYPE != 'batch';
}

export const shouldStartRabbit = () => {
  return process.env.NODE_ENV == 'local' || process.env.START_TYPE === 'batch'
}

export const activeMessageCreatedTopic = 'active_message_created';

export const emailStatusTopic = 'email_status';

export const getQueueName = (queue: string) => {
  return `API.${queue}`;
  // return `AUTOMATIC_MESSAGE.${queue}`;
};

export const generateDayPeriod = (date: string | Date) => {
  try {
    const currentHour = Number(moment(date).format('HH'));

    if (currentHour >= 3 && currentHour < 12) {
      return 'Manhã';
    } else if (currentHour >= 12 && currentHour < 18) {
      return 'Tarde';
    } else if (currentHour >= 18 || currentHour < 3) {
      return 'Noite';
    }
  } catch (e) {
    try {
      console.log('generateDayPeriod', e);
      console.log('generateDayPeriod incoming param', date);
    } catch (e2) {
      console.log('generateDayPeriod catch 2', e2);
    }
  }
};
export enum typeDownloadEnum {
  CSV = 'CSV',
  XLSX = 'XLSX',
}
export const downloadFileType = (
  fileType: typeDownloadEnum,
  data: any[],
  response,
  fileName: string,
) => {
  try {
    if (fileType === typeDownloadEnum.CSV) {
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(data);
      var fileContents = Buffer.from(csv);

      response.setHeader('Content-Encoding', 'gzip');
      response.set(
        'Content-disposition',
        `attachment; filename=${fileName}.csv`,
      );
      response.set('Content-Type', 'text/csv');

      const compressedStream = createGzip();
      compressedStream.pipe(response);
      compressedStream.end(fileContents);
    } else {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Planilha 1');
      const xlsxBuffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx',
      });
      response.set(
        'Content-disposition',
        `attachment; filename=${fileName}.xlsx`,
      );
      response.set(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      response.send(xlsxBuffer);
    }
  } catch (err) {
    console.error(err);
    response.status(500).send('Erro ao exportar arquivo');
  }
};
