/**
 * for-more 库的单元测试
 */
import forMore from '../index';

// 扩展Array.prototype
require('../index');

describe('for-more', () => {
  // 基本功能测试
  describe('basic functionality', () => {
    it('should process array elements in parallel', async () => {
      const results = await forMore([1, 2, 3], 2, (item: number) => item * 2);
      expect(results).toEqual([2, 4, 6]);
    });

    it('should work as an array method', async () => {
      const results = await [1, 2, 3].forMore(2, (item: number) => item * 2);
      expect(results).toEqual([2, 4, 6]);
    });

    it('should handle empty arrays', async () => {
      const results = await forMore([], 2, (item: any) => item);
      expect(results).toEqual([]);
    });

    it('should handle single element arrays', async () => {
      const results = await forMore([5], 2, (item: number) => item * 2);
      expect(results).toEqual([10]);
    });
  });

  // 异步功能测试
  describe('async functionality', () => {
    it('should handle async functions', async () => {
      const results = await forMore([1, 2, 3], 2, async (item: number) => {
        return new Promise(resolve => {
          setTimeout(() => resolve(item * 2), 100);
        });
      });
      expect(results).toEqual([2, 4, 6]);
    });

    it('should handle mixed sync and async functions', async () => {
      const results = await forMore([1, 2, 3], 2, (item: number) => {
        if (item % 2 === 0) {
          return new Promise(resolve => {
            setTimeout(() => resolve(item * 2), 50);
          });
        }
        return item * 2;
      });
      expect(results).toEqual([2, 4, 6]);
    });
  });

  // 并发控制测试
  describe('concurrency control', () => {
    it('should respect the lines option', async () => {
      let runningCount = 0;
      let maxRunning = 0;

      await forMore([1, 2, 3, 4, 5], 2, async (item: number) => {
        runningCount++;
        maxRunning = Math.max(maxRunning, runningCount);
        await new Promise(resolve => setTimeout(resolve, 50));
        runningCount--;
        return item;
      });

      expect(maxRunning).toBe(2);
    });

    it('should respect the concurrency option', async () => {
      let runningCount = 0;
      let maxRunning = 0;

      await forMore([1, 2, 3, 4, 5], { concurrency: 3 }, async (item: number) => {
        runningCount++;
        maxRunning = Math.max(maxRunning, runningCount);
        await new Promise(resolve => setTimeout(resolve, 50));
        runningCount--;
        return item;
      });

      expect(maxRunning).toBe(3);
    });
  });

  // 错误处理测试
  describe('error handling', () => {
    it('should handle errors without aborting by default', async () => {
      const results = await forMore([1, 2, 3], 2, (item: number) => {
        if (item === 2) {
          throw new Error('Test error');
        }
        return item * 2;
      }).catch(() => {
        // 不应该进入catch，因为默认abort为false
        return [];
      });
      expect(results).toEqual([2, expect.any(Error), 6]);
    });

    it('should abort on error when abort option is true', async () => {
      let processedItems = 0;

      await expect(forMore([1, 2, 3], { abort: true }, (item: number) => {
        processedItems++;
        if (item === 2) {
          throw new Error('Test error');
        }
        return item * 2;
      })).rejects.toThrow('Test error');

      // 应该只处理了前两个项目
      expect(processedItems).toBe(2);
    });

    it('should call custom onError handler', async () => {
      let onErrorCalled = false;

      const results = await forMore([1, 2, 3], {
        onError: (error: any, index: number, item: any) => {
          onErrorCalled = true;
          expect(error).toBeInstanceOf(Error);
          expect(index).toBe(1);
          expect(item).toBe(2);
          return false; // 不中止
        }
      }, (item: number) => {
        if (item === 2) {
          throw new Error('Test error');
        }
        return item * 2;
      });

      expect(onErrorCalled).toBe(true);
      expect(results).toEqual([2, expect.any(Error), 6]);
    });
  });

  // 回调函数测试
  describe('callback function', () => {
    it('should call callback when provided', (done) => {
      forMore([1, 2, 3], 2, (item: number) => item * 2, (results: any[], originalArray: any[]) => {
        expect(results).toEqual([2, 4, 6]);
        expect(originalArray).toEqual([1, 2, 3]);
        done();
      });
    });
  });

  // 类数组对象测试
  describe('array-like objects', () => {
    it('should handle array-like objects', async () => {
      const arrayLike = { 0: 1, 1: 2, 2: 3, length: 3 };
      const results = await forMore(arrayLike, 2, (item: number) => item * 2);
      expect(results).toEqual([2, 4, 6]);
    });
  });

  // 取消机制测试
  describe('cancel mechanism', () => {
    it('should cancel execution when cancel is called', async () => {
      let processedItems = 0;
      const promise = forMore([1, 2, 3, 4, 5], 2, async (item: number) => {
        processedItems++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return item;
      });

      // 立即取消
      promise.cancel();

      // 等待一下，确保取消生效
      await new Promise(resolve => setTimeout(resolve, 50));

      // 应该只处理了部分项目
      expect(processedItems).toBeLessThan(5);
    });
  });

  // 参数验证测试
  describe('parameter validation', () => {
    it('should throw error for non-array input', () => {
      expect(() => {
        // 故意传入非数组，类型断言为any绕过TypeScript检查
        (forMore as any)('not an array', 2, () => {});
      }).toThrow(TypeError);
    });

    it('should throw error for non-function handler', () => {
      expect(() => {
        // 故意传入非函数，类型断言为any绕过TypeScript检查
        forMore([1, 2, 3], 2, 'not a function' as any);
      }).toThrow(TypeError);
    });
  });
});
