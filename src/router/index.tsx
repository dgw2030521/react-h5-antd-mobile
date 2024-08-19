import React from 'react';

import NotFound from '@/components/NotFound';
import BasicLayout from '@/layouts/BasicLayout';
import Home from '@/views/home';

const routes = [
  {
    path: '/',
    handle: {
      title: 'h5模板 ',
    },
    element: <BasicLayout />,
    children: [
      {
        index: true,
        handle: {
          title: '首页 ',
        },
        element: <Home />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];
export default routes;
