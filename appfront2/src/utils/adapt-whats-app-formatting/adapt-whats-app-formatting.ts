export const adaptWhatsAppFormatting = (text: string) => {
  return text
    .replace(/(?<!\\)\*(.*?)\*(?!\\)/g, '**$1**')
    .replace(/(?<!\\)_(.*?)_(?!\\)/g, '*$1*')
    .replace(/~(.*?)~/g, '~~$1~~')
    .replace(/```(.*?)```/gs, '`$1`')
    .replace(/\\n/g, '  \n');
};
