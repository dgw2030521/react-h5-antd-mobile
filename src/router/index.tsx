import React from 'react';

import BasicLayout from '@/layouts/BasicLayout';
import Home from '@/views/home';

const routes = [
  {
    path: '/',
    handle: {
      title: '天府蓉易享 ',
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
    ],
  },
];
export default routes;
