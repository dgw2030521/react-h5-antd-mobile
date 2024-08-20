/**
 * 请求库axios封装 https://axios-http.com/zh/docs/req_config
 * 1、普通表单提交 application/x-www-form-urlencoded https://axios-http.com/zh/docs/urlencoded
 * 2、文件上传 formData https://axios-http.com/zh/docs/multipart
 * 3、json提交 application/json
 * 4、下载文件 stream
 */

import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  Method,
} from 'axios';
import axios from 'axios';

import { Response } from '@/types/Common';

const token_name = 'token';

const host = import.meta.env.VITE_APP_DOMAIN;

/**
 * 下载文件功能
 * @param response
 */
const download = (response: AxiosResponse) => {
  const { data, headers } = response;
  const fileName = headers['content-disposition'].replace(
    /\w+;filename=(.*)/,
    '$1',
  ) as string;

  // 此处当返回json文件时需要先对data进行JSON.stringify处理，其他类型文件不用做处理
  // const blob = new Blob([JSON.stringify(data)], ...)
  const blob = new Blob([data], { type: headers['content-type'] });
  const dom = document.createElement('a');
  const url = window.URL.createObjectURL(blob);
  dom.href = url;
  dom.download = decodeURI(fileName);
  dom.style.display = 'none';
  document.body.appendChild(dom);
  dom.click();
  dom.parentNode.removeChild(dom);
  window.URL.revokeObjectURL(url);
};

interface PendingType {
  url?: string;
  method?: Method;
  params: any;
  data: any;
  cancel: Function;
}

// 登录失效
const CancelToken = axios.CancelToken;
const source = CancelToken.source();
const controller = new AbortController();

// 取消重复请求
const pending: Array<PendingType> = [];
// 移除重复请求
const removePending = (config: AxiosRequestConfig) => {
  for (const key in pending) {
    const item: number = +key;
    const list: PendingType = pending[key];
    // 当前请求在数组中存在时执行函数体
    if (
      list.url === config.url &&
      list.method === config.method &&
      JSON.stringify(list.params) === JSON.stringify(config.params) &&
      JSON.stringify(list.data) === JSON.stringify(config.data)
    ) {
      // 执行取消操作
      list.cancel('操作太频繁，请稍后再试');
      // 从数组中移除记录
      pending.splice(item, 1);
    }
  }
};

const axiosInstance = axios.create({
  baseURL: host,
  timeout: 10000,
  withCredentials: false,
  responseType: 'json',
  // responseType: 'blob'; 下载
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
});

// 请求拦截器
axiosInstance.interceptors.request.use(
  (req: InternalAxiosRequestConfig) => {
    req.headers.Authorization = localStorage.getItem(token_name);
    if (req.data instanceof FormData) {
      req.headers['Content-Type'] = 'multipart/form-data;charset=utf-8';
    }

    removePending(req);
    req.cancelToken = new CancelToken(c => {
      pending.push({
        url: req.url,
        method: `${req.method}`,
        params: req.params,
        data: req.data,
        cancel: c,
      });
    });

    return {
      ...req,
      cancelToken: source.token,
      signal: controller.signal,
    };
  },
  (err: AxiosError) => {
    return Promise.reject(err);
  },
);

/**
 * 响应请求处理
 */
axiosInstance.interceptors.response.use(
  async response => {
    removePending(response.config);

    if (
      response.data instanceof Blob &&
      response.data.type?.includes('application/json')
    ) {
      const text = await response.data?.text();
      const json = JSON.parse(text);
      return {
        ...response,
        data: json,
      };
    }
    return response;
  },
  err => {
    return Promise.reject(err);
  },
);

async function axiosRequest<T>(req: AxiosRequestConfig) {
  return new Promise<T>((resolve, reject) => {
    axiosInstance
      .request<Response<T>>(req)
      .then(resp => {
        const { status } = resp;
        const result = resp.data;
        if (status < 200 || status > 300) {
          reject(result);
        }
        // 下载
        if (result instanceof Blob) {
          return download(resp);
        }
        // 普通返回
        if (!result.success) {
          if (
            result.errorCode === '401' ||
            result.errorCode === '401_1' ||
            result.errorCode === '401_0' ||
            result.errorCode === '003'
          ) {
            // 登录失效后，取消后续的http请求
            source.cancel('登录失效');
            // 不支持 message 参数
            controller.abort();

            // 登录失效后的处理
            // window.location.href = configParams.loginErrUrl;
          }
          // @NOTICE 业务失败
          reject(result);
        } else {
          resolve(result.data);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
}

function rpcRequest<T>(props: Partial<AxiosRequestConfig>) {
  const req: AxiosRequestConfig = {
    // `paramsSerializer` 是一个负责 `params` 序列化的函数
    // (e.g. https://www.npmjs.com/package/qs, http://api.jquery.com/jquery.param/)
    // paramsSerializer(params) {
    //   return Qs.stringify(params, { arrayFormat: 'brackets' });
    // },
    ...props,
    method: props.method || 'GET',
  };

  if (props.data) {
    const { data } = props;
    // 文件上传
    if (
      req.headers?.['Content-Type'] === 'multipart/form-data' ||
      data instanceof FormData
    ) {
      req.data = data;
    } else if (req.method.toUpperCase() === 'GET') {
      req.params = data;
    } else {
      // 转成string
      req.data = JSON.stringify(data);
    }
  }

  return axiosRequest<T>(req);
}

const request = {
  get: <T>(url: string, config?: Partial<AxiosRequestConfig>) =>
    rpcRequest<T>({ ...config, url, method: 'GET' }),
  post: <T>(url: string, data: any, config?: Partial<AxiosRequestConfig>) =>
    rpcRequest<T>({ ...config, url, data, method: 'POST' }),
  put: <T>(url: string, data: any, config?: Partial<AxiosRequestConfig>) =>
    rpcRequest<T>({ ...config, url, data, method: 'PUT' }),
};

export { axiosInstance as axios, request, rpcRequest };
