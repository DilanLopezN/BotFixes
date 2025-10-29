export const downloadFile = (data: Blob, fileName: string, fileType: string) => {
  const url = window.URL.createObjectURL(new Blob([data], { type: fileType }));
  const link = document.createElement('a');
  link.setAttribute('download', fileName);
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
