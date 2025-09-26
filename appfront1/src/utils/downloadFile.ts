export const downloadFile = (data, fileName: string, fileType: 'xlsx' | 'csv') => {
    const url =
        fileType === 'csv'
            ? window.URL.createObjectURL(new Blob([data], { type: 'text/csv' }))
            : window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.setAttribute('download', `${fileName}.${fileType}`);
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
