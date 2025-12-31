/**
 * for-more - Multithread Synchronization Loop Library with Promise Support
 * @version 1.1.0
 * @author LinQuan
 * @license MIT
 */
/**
 * 工具函数集合
 */
var utils = {
    /**
     * 检查值是否为Promise对象
     * @param it 要检查的值
     * @returns 如果是Promise对象则返回true，否则返回false
     */
    isPromise: function (it) {
        return Object.prototype.toString.call(it) === '[object Promise]';
    },
    /**
     * 检查值是否为异步函数
     * @param it 要检查的值
     * @returns 如果是异步函数则返回true，否则返回false
     */
    isAsyncFunction: function (it) {
        return Object.prototype.toString.call(it) === '[object AsyncFunction]';
    },
    /**
     * 检查值是否为函数
     * @param it 要检查的值
     * @returns 如果是函数则返回true，否则返回false
     */
    isFunction: function (it) {
        return Object.prototype.toString.call(it) === '[object Function]';
    },
    /**
     * 检查值是否为Error对象
     * @param it 要检查的值
     * @returns 如果是Error对象则返回true，否则返回false
     */
    isError: function (it) {
        return Object.prototype.toString.call(it) === '[object Error]';
    },
    /**
     * 检查值是否为数字
     * @param it 要检查的值
     * @returns 如果是数字则返回true，否则返回false
     */
    isNumber: function (it) {
        return Object.prototype.toString.call(it) === '[object Number]';
    },
    /**
     * 检查值是否为数组或类数组对象
     * @param it 要检查的值
     * @returns 如果是数组或类数组对象则返回true，否则返回false
     */
    isArrayLike: function (it) {
        return Array.isArray(it) || (typeof it === 'object' && it !== null && 'length' in it && typeof it.length === 'number');
    },
    /**
     * 将类数组对象转换为数组
     * @param it 类数组对象
     * @returns 转换后的数组
     */
    toArray: function (it) {
        return Array.isArray(it) ? it : Array.from(it);
    }
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
function forMoreFun(O, len, handler, options, resolve, reject) {
    var completed = 0;
    var runing = 0;
    var isCancelled = false;
    var results = [];
    /**
     * 取消正在进行的迭代
     */
    var cancel = function () {
        isCancelled = true;
        runing = len; // 阻止新任务启动
    };
    /**
     * 处理单个元素
     */
    function forMore() {
        var index = runing++;
        if (index >= len || isCancelled) {
            return;
        }
        var item = O[index];
        var result;
        try {
            result = handler(item, index, O);
        }
        catch (e) {
            result = e;
        }
        if (utils.isPromise(result)) {
            return result
                .then(function (res) {
                return judge(index, res, false);
            })
                .catch(function (err) {
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
    function judge(index, result, is_error) {
        if (isCancelled) {
            return;
        }
        if (is_error) {
            var shouldAbort = options.abort;
            // 调用自定义错误处理函数
            if (utils.isFunction(options.onError)) {
                shouldAbort = options.onError(result, index, O[index]) || options.abort;
            }
            if (shouldAbort) {
                cancel(); // 取消执行
                if (options.callback) {
                    return options.callback(results, O);
                }
                else {
                    return reject(result);
                }
            }
        }
        results[index] = result;
        if (++completed === len) {
            if (options.callback) {
                return options.callback(results, O);
            }
            else {
                return resolve(results, O);
            }
        }
        return forMore();
    }
    // 启动并行执行
    var lines = options.lines || options.concurrency || 1;
    for (var i = 0; i < lines && runing < len; i++) {
        forMore();
    }
    return { cancel: cancel };
}
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
var forMore = function (array, options, handler, callback) {
    var _this = this;
    // 参数验证
    if (!utils.isArrayLike(array)) {
        throw new TypeError('Expected the first argument to be an array or array-like object');
    }
    // 转换为数组
    var O = utils.toArray(array);
    var len = O.length >>> 0;
    if (!len) {
        var promise_1 = Promise.resolve([]);
        return Object.assign(promise_1, { cancel: function () { } });
    }
    var opts = {};
    var cb;
    var cbk;
    // 参数解析
    if (utils.isNumber(options)) {
        opts = { lines: options };
        cb = handler;
        cbk = callback;
    }
    else if (utils.isFunction(options)) {
        cb = options;
        cbk = handler;
    }
    else {
        opts = options || {};
        cb = handler;
        cbk = callback;
    }
    // 验证handler函数
    if (!utils.isFunction(cb)) {
        throw new TypeError('Expected handler to be a function');
    }
    // 合并默认选项
    var finalOptions = Object.assign({}, {
        promiseLibrary: Promise,
        abort: false,
        concurrency: 1
    }, opts, {
        // 使用concurrency作为lines的别名
        lines: Math.min((parseInt(String(opts.lines || opts.concurrency))), len) || 1,
        callback: utils.isFunction(cbk) ? cbk : undefined
    });
    // 创建可取消的Promise
    var cancelFn;
    // 显式指定Promise泛型类型为any[]
    var promise = new finalOptions.promiseLibrary(function (resolve, reject) {
        var cancel = forMoreFun.call(_this, O, len, cb, finalOptions, resolve, reject).cancel;
        cancelFn = cancel;
    });
    // 添加cancel方法
    var cancellablePromise = Object.assign(promise, {
        cancel: function () {
            if (cancelFn) {
                cancelFn();
            }
        }
    });
    return cancellablePromise;
};
/**
 * 扩展Array原型，添加forMore方法
 */
Array.prototype.forMore = function (options, handler, callback) {
    var O = Object(this);
    return forMore.call(this, O, options, handler, callback);
};
// CommonJS导出
if (typeof exports === 'object') {
    module.exports = forMore;
    module.exports.default = forMore;
}

export { forMore as default };
//# sourceMappingURL=index.esm.js.map
