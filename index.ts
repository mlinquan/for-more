/**
 * for-more - Multithread Synchronization Loop Library with Promise Support
 * @version 1.1.0
 * @author LinQuan
 * @license MIT
 */

/**
 * 处理数组中每个元素的回调函数类型
 * @template T 数组元素类型
 * @template U 处理结果类型
 * @param item 当前处理的元素
 * @param index 元素索引
 * @param array 原始数组
 * @returns 处理结果或Promise对象
 */
type ForMoreCallback<T = unknown, U = T> = (item: T, index: number, array: T[]) => U | Promise<U>;

/**
 * forMore配置选项
 */
type ForMoreOptions = {
  /** 并行执行的行数（默认：1） */
  lines?: number;
  /** 并发数别名，与lines功能相同 */
  concurrency?: number;
  /** 遇到错误时是否中止执行（默认：false） */
  abort?: boolean;
  /** 自定义Promise库（默认：全局Promise） */
  promiseLibrary?: PromiseConstructor;
  /** 完成回调函数 */
  callback?: (results: any[], originalArray: any[]) => void;
  /** 自定义错误处理函数，返回true表示中止执行 */
  onError?: (error: any, index: number, item: any) => boolean;
};

/**
 * 增强的Promise类型，包含取消方法
 */
type CancellablePromise<T> = Promise<T> & {
  /** 取消正在进行的迭代 */
  cancel: () => void;
};

/**
 * 扩展Array接口，添加forMore方法
 */
declare global {
  interface Array<T> {
    /**
     * 使用forMore并行处理数组元素
     * @template U 处理结果类型
     * @param options 配置选项或并行行数
     * @param handler 处理回调函数
     * @param callback 完成回调函数（可选）
     * @returns 包含处理结果的Promise对象
     */
    forMore<U>(options: number | ForMoreOptions, handler: ForMoreCallback<T, U>, callback?: (...args: any[]) => void): CancellablePromise<U[]>;
    /**
     * 使用forMore并行处理数组元素（简化版，使用默认配置）
     * @template U 处理结果类型
     * @param handler 处理回调函数
     * @param callback 完成回调函数（可选）
     * @returns 包含处理结果的Promise对象
     */
    forMore<U>(handler: ForMoreCallback<T, U>, callback?: (...args: any[]) => void): CancellablePromise<U[]>;
  }
}

/**
 * 工具函数集合
 */
const utils = {
  /**
   * 检查值是否为Promise对象
   * @param it 要检查的值
   * @returns 如果是Promise对象则返回true，否则返回false
   */
  isPromise: (it: any): it is Promise<any> => 
    Object.prototype.toString.call(it) === '[object Promise]',
  
  /**
   * 检查值是否为异步函数
   * @param it 要检查的值
   * @returns 如果是异步函数则返回true，否则返回false
   */
  isAsyncFunction: (it: any): it is (...args: any[]) => Promise<any> => 
    Object.prototype.toString.call(it) === '[object AsyncFunction]',
  
  /**
   * 检查值是否为函数
   * @param it 要检查的值
   * @returns 如果是函数则返回true，否则返回false
   */
  isFunction: (it: any): it is Function => 
    Object.prototype.toString.call(it) === '[object Function]',
  
  /**
   * 检查值是否为Error对象
   * @param it 要检查的值
   * @returns 如果是Error对象则返回true，否则返回false
   */
  isError: (it: any): it is Error => 
    Object.prototype.toString.call(it) === '[object Error]',
  
  /**
   * 检查值是否为数字
   * @param it 要检查的值
   * @returns 如果是数字则返回true，否则返回false
   */
  isNumber: (it: any): it is number => 
    Object.prototype.toString.call(it) === '[object Number]',
  
  /**
   * 检查值是否为数组或类数组对象
   * @param it 要检查的值
   * @returns 如果是数组或类数组对象则返回true，否则返回false
   */
  isArrayLike: (it: any): it is ArrayLike<any> => 
    Array.isArray(it) || (typeof it === 'object' && it !== null && 'length' in it && typeof it.length === 'number'),
  
  /**
   * 将类数组对象转换为数组
   * @param it 类数组对象
   * @returns 转换后的数组
   */
  toArray: <T>(it: ArrayLike<T>): T[] => 
    Array.isArray(it) ? it : Array.from(it)
};

/**
 * forMore核心实现函数，处理并行迭代逻辑
 * @param this 上下文对象
 * @param O 要迭代的数组
 * @param len 数组长度
 * @param handler 每个元素的处理函数
 * @param options 配置选项
 * @param resolve Promise解决函数
 * @param reject Promise拒绝函数
 * @returns 包含cancel方法的对象
 */
function forMoreFun(
  this: any,
  O: any[],
  len: number,
  handler: ForMoreCallback,
  options: ForMoreOptions,
  resolve: (results: any[], O: any[]) => void,
  reject: (error: any) => void
): { cancel: () => void } {
  let completed = 0;
  let runing = 0;
  let isCancelled = false;
  const results: any[] = [];

  /**
   * 取消正在进行的迭代
   */
  const cancel = (): void => {
    isCancelled = true;
    runing = len; // 阻止新任务启动
  };

  /**
   * 处理单个元素
   */
  function forMore(): void | Promise<void> {
    const index = runing++;

    if (index >= len || isCancelled) {
      return;
    }

    const item = O[index];
    let result: any;

    try {
      result = handler(item, index, O);
    } catch (e) {
      result = e;
    }

    if (utils.isPromise(result)) {
      return result
        .then(function(res) {
          return judge(index, res, false);
        })
        .catch(function(err) {
          return judge(index, err, true);
        });
    }
    return judge(index, result, utils.isError(result));
  }

  /**
   * 处理单个元素的结果
   * @param index 元素索引
   * @param result 处理结果
   * @param is_error 是否为错误
   */
  function judge(index: number, result: any, is_error: boolean): void | Promise<void> {
    if (isCancelled) {
      return;
    }

    if (is_error) {
      let shouldAbort = options.abort;
      
      // 调用自定义错误处理函数
      if (utils.isFunction(options.onError)) {
        shouldAbort = options.onError(result, index, O[index]) || options.abort;
      }
      
      if (shouldAbort) {
        cancel(); // 取消执行
        if (options.callback) {
          return options.callback(results, O);
        } else {
          return reject(result);
        }
      }
    }
    
    results[index] = result;
    
    if (++completed === len) {
      if (options.callback) {
        return options.callback(results, O);
      } else {
        return resolve(results, O);
      }
    }
    
    return forMore();
  }

  // 启动并行执行
  const lines = options.lines || options.concurrency || 1;
  for (let i = 0; i < lines && runing < len; i++) {
    forMore();
  }

  return { cancel };
}

/**
 * forMore函数类型定义
 */
type ForMore = {
  /**
   * 使用forMore并行处理数组元素
   * @template T 数组元素类型
   * @template U 处理结果类型
   * @param array 要处理的数组
   * @param options 配置选项或并行行数
   * @param handler 处理回调函数
   * @param callback 完成回调函数（可选）
   * @returns 包含处理结果的可取消Promise对象
   */
  <T, U>(array: T[] | ArrayLike<T>, options: number | ForMoreOptions, handler: ForMoreCallback<T, U>, callback?: (...args: any[]) => void): CancellablePromise<U[]>;
  /**
   * 使用forMore并行处理数组元素（简化版，使用默认配置）
   * @template T 数组元素类型
   * @template U 处理结果类型
   * @param array 要处理的数组
   * @param handler 处理回调函数
   * @param callback 完成回调函数（可选）
   * @returns 包含处理结果的可取消Promise对象
   */
  <T, U>(array: T[] | ArrayLike<T>, handler: ForMoreCallback<T, U>, callback?: (...args: any[]) => void): CancellablePromise<U[]>;
  /**
   * 使用forMore并行处理数组元素（通用版）
   * @param array 要处理的数组
   * @param options 配置选项或并行行数
   * @param handler 处理回调函数
   * @param callback 完成回调函数（可选）
   * @returns 包含处理结果的可取消Promise对象
   */
  (array: any[] | ArrayLike<any>, options: any, handler: any, callback?: any): CancellablePromise<any[]>;
};

/**
 * 用于并行处理数组元素的函数
 * @example
 * // 基本用法
 * forMore([1, 2, 3], 2, (item) => item * 2).then(results => console.log(results));
 * 
 * // 异步用法
 * forMore([1, 2, 3], 2, async (item) => {
 *   const response = await fetch(`https://api.example.com/data/${item}`);
 *   return response.json();
 * }).then(results => console.log(results));
 */
const forMore: ForMore = function(
  this: any,
  array: any[] | ArrayLike<any>,
  options: any,
  handler?: any,
  callback?: any
): CancellablePromise<any[]> {
  // 参数验证
  if (!utils.isArrayLike(array)) {
    throw new TypeError('Expected the first argument to be an array or array-like object');
  }
  
  // 转换为数组
  const O = utils.toArray(array);
  const len = O.length >>> 0;

  if (!len) {
    const promise = Promise.resolve([]);
    return Object.assign(promise, { cancel: () => {} });
  }

  let opts: ForMoreOptions = {};
  let cb: ForMoreCallback;
  let cbk: any;

  // 参数解析
  if (utils.isNumber(options)) {
    opts = { lines: options };
    cb = handler;
    cbk = callback;
  } else if (utils.isFunction(options)) {
    cb = options;
    cbk = handler;
  } else {
    opts = options || {};
    cb = handler;
    cbk = callback;
  }

  // 验证handler函数
  if (!utils.isFunction(cb)) {
    throw new TypeError('Expected handler to be a function');
  }

  // 合并默认选项
  const finalOptions: ForMoreOptions = Object.assign({}, {
    promiseLibrary: Promise,
    abort: false,
    concurrency: 1
  }, opts, {
    // 使用concurrency作为lines的别名
    lines: Math.min((parseInt(String(opts.lines || opts.concurrency))), len) || 1,
    callback: utils.isFunction(cbk) ? cbk : undefined
  });

  // 创建可取消的Promise
  let cancelFn: () => void;
  // 显式指定Promise泛型类型为any[]
  const promise = new (finalOptions.promiseLibrary as PromiseConstructor)<any[]>((resolve, reject) => {
    const { cancel } = forMoreFun.call(this, O, len, cb, finalOptions, resolve, reject);
    cancelFn = cancel;
  });

  // 添加cancel方法
  const cancellablePromise = Object.assign(promise, {
    cancel: () => {
      if (cancelFn) {
        cancelFn();
      }
    }
  }) as CancellablePromise<any[]>;

  return cancellablePromise;
};

/**
 * 扩展Array原型，添加forMore方法
 */
Array.prototype.forMore = function(
  options: any,
  handler?: any,
  callback?: any
): CancellablePromise<any[]> {
  const O = Object(this);
  return forMore.call(this, O, options, handler, callback);
};

// ES模块导出
export default forMore;

// CommonJS导出
if (typeof exports === 'object') {
  module.exports = forMore;
  module.exports.default = forMore;
}