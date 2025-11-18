export const capitalizeText = (phrase: string): string => {
  return (
    phrase
      ?.toLowerCase()
      ?.trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || ''
  );
};
