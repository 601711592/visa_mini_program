declare namespace API {
  type RequestPage = {
    page?: number;
    pageSize?: number;
  };

  type RequestPage<T> = {
    page?: number;
    pageSize?: number;
  } & T;

  type ResponseBody<T> = {
    code: number;
    data: T;
    msg: string;
  };

  type ResponseBodyPage<T> = {
    code: number;
    data: {
      data: T[];
      total: number;
      current: number;
      pageSize: number;
    };
    msg: string;
  };
}
