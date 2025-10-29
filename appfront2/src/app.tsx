import ReactGA from 'react-ga4';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';

if (process.env.NODE_ENV === 'production') {
  ReactGA.initialize('G-W6MEK0LRE3', {
    gtagOptions: {
      send_page_view: false,
    },
  });
}

const router = createBrowserRouter([{ path: '*', element: <AppRoutes /> }], { basename: '/v2' });

export const App = () => {
  return <RouterProvider router={router} />;
};
