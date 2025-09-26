export const generateLocaleKeys = <T>(obj: T, nodePath?: string) => {
  const novoObjeto: any = {};

  Object.keys(obj as object).forEach((key) => {
    const typedKey = key as keyof typeof obj;
    const value = nodePath ? `${nodePath}.${key}` : key;
    if (typeof obj[typedKey] === 'object' && obj[typedKey] !== null) {
      novoObjeto[typedKey] = generateLocaleKeys(obj[typedKey], value);
    } else {
      novoObjeto[typedKey] = value;
    }
  });

  return novoObjeto as T;
};
