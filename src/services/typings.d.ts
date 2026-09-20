declare namespace API {
  /** 分页查询参数，可通过泛型追加业务筛选条件。 */
  type RequestPage<T = unknown> = {
    page?: number; // 页码，从 1 开始
    pageSize?: number; // 每页条数
  } & T;

  /** 后端统一响应；业务失败由 request 统一抛出。 */
  type ResponseBody<T> = {
    status: number; // 11 表示成功
    data: T; // 业务数据
    msg: string; // 提示信息
  };

  /** 后端直接返回 Laravel 分页结果，保留原始字段名。 */
  type ResponseBodyPage<T> = ResponseBody<{
    data: T[]; // 当前页数据
    total: number; // 总条数
    current_page: number; // 当前页码
    per_page: number; // 每页条数
  }>;
}
