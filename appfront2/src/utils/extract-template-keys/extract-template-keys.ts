export const extractTemplateKeys = (message: string | undefined) => {
  if (!message) {
    return [];
  }

  const matches = message.match(/{{(.*?)}}/g);
  if (!matches) return [];

  return matches.map((match) => match.replace(/{{|}}/g, '').trim());
};
