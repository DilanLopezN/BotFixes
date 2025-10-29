export const fileToBase64 = async (file: File): Promise<{ contents: string; url: string }> => {
    return new Promise<{ contents: string; url: string }>((resolve, reject) => {
        const reader = new FileReader();

        reader.readAsDataURL(file);

        reader.addEventListener('load', () => {
            const urlParts = (reader.result as string).split(';');
            const base64 = urlParts[1].replace('base64,', '');

            resolve({
                contents: base64,
                url: reader.result as string,
            });
        });

        reader.addEventListener('error', (error) => reject(error));
    });
};
