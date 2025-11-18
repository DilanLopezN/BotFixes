interface CleanseConfig {
  deleteNegativeValues?: boolean;
  replaceNegativeWithEmptyString?: boolean;
}

export const cleanseObject = (obj: any, config?: CleanseConfig, attempt = 0) => {
  if (attempt >= 100) {
    console.log('Exceeded maximum recursion attempts');
    return obj;
  }

  if (!obj) {
    return obj;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object') {
      cleanseObject(value, config, attempt + 1);

      if (!Object.keys(value || {}).length) {
        delete obj[key];
      }
    } else if (typeof value === 'undefined') {
      delete obj[key];
    } else if ((value as any) < 0) {
      if (config?.replaceNegativeWithEmptyString) {
        obj[key] = '';
      } else {
        delete obj[key];
      }
    }
  }

  return obj;
};
