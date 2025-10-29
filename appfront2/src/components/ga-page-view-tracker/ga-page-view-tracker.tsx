import { useEffect } from 'react';
import ReactGA from 'react-ga4';
import { useLocation } from 'react-router-dom';

export const GaPageViewTracker = () => {
  const location = useLocation();

  useEffect(() => {
    try {
      if (process.env.NODE_ENV === 'production') {
        const normalizedPathname = location.pathname.replace(/\/(\d+|[0-9a-fA-F]{24})\b/g, '/:id');

        ReactGA.send({ hitType: 'pageview', page: `v2${normalizedPathname}` });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('GA Page view error: ', error);
    }
  }, [location.pathname]);

  return null;
};
