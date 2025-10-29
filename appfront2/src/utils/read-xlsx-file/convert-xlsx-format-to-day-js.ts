export const convertExcelPatternToDayjs = (excelFormat: string) => {
  const patternMap = {
    '[$-416]d" de "mmmm" de "yyyy': { pattern: 'DD [de] MMMM [de] YYYY', language: 'pt-br' },
    '[$-416]dddd, d" de "mmmm" de "yyyy': {
      pattern: 'dddd, D [de] MMMM [de] YYYY',
      language: 'pt-br',
    },
  };

  return patternMap[excelFormat as keyof typeof patternMap];
};
