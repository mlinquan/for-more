var forMore = (function() {
  var op = Object.prototype
  var ostring = op.toString

  function isPromise(it) {
    return ostring.call(it) === '[object Promise]'
  }

  function isAsyncFunction(it) {
    return ostring.call(it) === '[object AsyncFunction]'
  }

  function isFunction(it) {
    return ostring.call(it) === '[object Function]'
  }

  function isError(it) {
    return ostring.call(it) === '[object Error]'
  }

  function isNumber(it) {
    return ostring.call(it) === '[object Number]'
  }

  function forMoreFun(O, len, handler, options, resolve, reject) {

    var completed = 0,
      runing = 0,
      results = []

    function forMore() {
      var index = runing++

      if (index >= len) {
        return
      }

      var item = O[index]
      var result

      try {
        result = handler(item, index, O)
      } catch (e) {
        result = e
      }

      if (isPromise(result)) {
        return result
          .then(function(res) {
            return judge(index, res)
          })
          .catch(function(err) {
            console.log(err)
            return judge(index, err, 1)
          })
      }
      return judge(index, result, isError(result))
    }

    function judge(index, result, is_error) {
      if (is_error) {
        if (options.abort) {
          runing = len
          if (options.callback) {
            return options.callback(result)
          } else {
            return reject(result)
          }
        }
      }
      results[index] = result
      if (++completed === len) {
        if (options.callback) {
          return options.callback(results, O)
        } else {
          return resolve(results, O)
        }
      }
      return forMore()
    }

    for (var i = 0; i < options.lines; i++) {
      forMore()
    }
  }

  function forMore(O, options, handler, callback) {
    var len = O.length >>> 0;

    if (!len) {
      return []
    }

    if (isNumber(options)) {
      options = {
        lines: options
      }
    }

    if ((isFunction(options) || isAsyncFunction(options))) {
      callback = handler
      handler = options
      options = {}
    }

    options = Object.assign({}, {
      promiseLibrary: Promise,
      abort: false,
      callback: isFunction(callback) && callback
    }, options, {
      lines: Math.min((parseInt(options.lines)), len) || 1
    })

    if (!options.callback) {
      return new options.promiseLibrary(function(resolve, reject) {
        return forMoreFun.call(this, O, len, handler, options, resolve, reject)
      })
    }
    return forMoreFun.call(this, O, len, handler, options)
  }

  Array.prototype.forMore = function(options, handler, callback) {
    var O = Object(this);
    return forMore.call(this, O, options, handler, callback)
  }

  return forMore
})()

if (typeof exports === 'object') {
  module.exports = forMore;
  module.exports.default = forMore;
}