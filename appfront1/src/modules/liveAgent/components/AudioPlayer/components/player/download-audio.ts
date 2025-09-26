export const downloadAudio = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const fileType = blob?.type?.split('/')?.[1]?.split(';')?.[0]?.trim() || 'ogg';

    const link = document.createElement('a');
    link.setAttribute('download', `audio.${fileType}`);
    link.href = blobUrl;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
};
