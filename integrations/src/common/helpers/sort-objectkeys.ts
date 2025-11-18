export const sortByKeys = (obj: any) =>
  Object.entries<any>(obj)
    .sort(([, a], [, b]) => a - b)
    .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
