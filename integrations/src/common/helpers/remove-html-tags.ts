export const removeHTMLTags = (text?: string): string => {
  text = text?.replace(/<br\s*\/?>/gi, '\n');
  text = text?.replaceAll('&nbsp;', '');
  return text?.replace(/<\/?[^>]+(>|$)/g, '');
};
