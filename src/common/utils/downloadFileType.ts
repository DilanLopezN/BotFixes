const XLSX = require('xlsx');
import { Parser } from 'json2csv';
import { createGzip } from 'zlib';

export enum typeDownloadEnum {
    CSV = 'CSV',
    XLSX = 'XLSX',
}

export const downloadFileType = (fileType: typeDownloadEnum, data: any[], response, fileName: string) => {
    try {
        if (fileType === typeDownloadEnum.CSV) {
            const json2csvParser = new Parser();
            const csv = json2csvParser.parse(data);
            var fileContents = Buffer.from(csv);

            response.setHeader('Content-Encoding', 'gzip');
            response.set('Content-disposition', `attachment; filename=${fileName}.csv`);
            response.set('Content-Type', 'text/csv');

            const compressedStream = createGzip();
            compressedStream.pipe(response);
            compressedStream.end(fileContents);
        } else {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Planilha 1');
            const xlsxBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            response.set('Content-disposition', `attachment; filename=${fileName}.xlsx`);
            response.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            response.send(xlsxBuffer);
        }
    } catch (err) {
        console.error(err);
        response.status(500).send('Erro ao exportar arquivo');
    }
};
