import _ from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createQueryString } from '~/utils/create-query-string';
import { UseQueryStringProps } from './interfaces';

export const useQueryString = <T extends Record<string, string>>(props?: UseQueryStringProps) => {
  const { allowedQueries } = props || {};
  const { search, pathname } = useLocation();
  const navigate = useNavigate();

  const queryStringAsObj = useMemo(() => {
    const searchParams = new URLSearchParams(search);
    const query: any = {};

    searchParams.forEach((value, key) => {
      query[key] = value;
    });

    return query as T;
  }, [search]);

  const updateQueryString = useCallback(
    (newParams: Record<string, any>) => {
      let newQueryObj = {} as any;

      if (allowedQueries && !_.isEmpty(allowedQueries)) {
        newQueryObj = allowedQueries.reduce((previousValue, currentValue) => {
          return {
            ...previousValue,
            [currentValue]: newParams[currentValue] ?? queryStringAsObj[currentValue],
          };
        }, {});
      } else {
        newQueryObj = { ...queryStringAsObj };

        Object.entries(newParams).forEach(([key, value]) => {
          newQueryObj[key] = value;
        });
      }

      const newQueryString = createQueryString(newQueryObj);
      navigate(pathname + newQueryString, { replace: true });
    },
    [allowedQueries, navigate, pathname, queryStringAsObj]
  );

  useEffect(() => {
    if (allowedQueries && !_.isEmpty(allowedQueries)) {
      const hasForbiddenQuery = Object.keys(queryStringAsObj).some(
        (queryKey) => !allowedQueries.includes(queryKey)
      );
      if (hasForbiddenQuery) {
        updateQueryString(queryStringAsObj);
      }
    }
  }, [allowedQueries, queryStringAsObj, updateQueryString]);

  return { queryString: search, queryStringAsObj, updateQueryString };
};
