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
declare const forMore: ForMore;
export default forMore;
//# sourceMappingURL=index.d.ts.map