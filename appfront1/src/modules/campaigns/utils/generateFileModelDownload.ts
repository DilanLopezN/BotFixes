import * as XLSX from 'xlsx';
import * as fs from 'fs';
XLSX.set_fs(fs);

const generateFileModelDownload = (fileName: string, data: any[]) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, fileName);

    return XLSX.writeFileXLSX(wb, fileName, {compression: true});
}

export default generateFileModelDownload;
