import _ from 'lodash';

export const createQueryString = (
  queryObj: Record<string, number | string | boolean | number[] | string[] | undefined | null>
) => {
  const normalizedQueryObj = Object.entries(queryObj).reduce((previousValue, currentValue) => {
    const [key, value] = currentValue;

    if (value === undefined || value === null || value === '') {
      return previousValue;
    }

    if (_.isArray(value) && _.isEmpty(value)) {
      return previousValue;
    }

    const normalizedValue = _.isArray(value) ? value.join(',') : value;

    return { ...previousValue, [key]: normalizedValue };
  }, {});

  const queryString = new URLSearchParams(normalizedQueryObj).toString();
  return queryString ? `?${queryString}` : '';
};
