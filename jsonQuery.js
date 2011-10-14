// TODO: add %
// TODO: add operation
// TODO: exists fn
// TODO: keep original query for string output
// TODO: joker *

/**
 * jsonQuery: a simple to use json selector
 * @param datas {Object} the json to select in
 * @return API { Object}
 * @function find('selector'): like in jQuery, feed with a selector it will return the property of the json targetted by selector.
 * @function test("val1" == "val2"): a tester for comparison or to execute function
 * @function addFilter(fnName, fn): create your own filter and use it just by register them
 */
var jsonQuery = (function () {

    var ORIGINAL_DATAS = {},
        START_DELIMITER = [".", "[", "(", "'", '"'],
        END_DELIMITER = ["]", ")","'", '"'],
        UGLY_PATTERN_STR = "@°~°@",
        UGLY_PATTERN_RGX = /@°~°@/g,
        debugMode = false;


    /**
     * @function
     * @param fnName {String} the name of the function
     * @description use to evaluate function, all the params passed after the name, will be passed to the function.
     * */
    function evaluateFunction(fnName /*, args1, args2..., index*/) {
        var args = Array.prototype.slice.apply(arguments, [0]);
        args = args.slice(1, args.length - 1);
        var index = arguments[arguments.length-1];

        // shortcut
        if (fnName == "position") {
            return index;
        }

        try {
            return jsonQuery.fn[fnName].apply(this, args);
        }

        catch(e) {
            try {
                log("try", "'" + args[0] + "'." + fnName + "()");
                // a method of native is called
                return eval("'" + args[0] + "'." + fnName + "()");
            } catch(e) {
                log("catch");
                throw "evaluateFunction() => Can't evaluate: " + fnName + "(" + args + ")";
            }
        }

    }

    /**
     * @function
     *  @description use to evaluate a test
     * @param test {String} the test to evaluate, typicaly something like that:   val1 == val2
     * @param datas {Object} the data to search in: try to eval('val1'), if not null, return else return as string
     * @param index {Number} the position from his parent object
     */

    function evaluate(test, datas, index) {
        if (!datas) datas = ORIGINAL_DATAS;

        test = fixEvalSyntax(test);

        // try to evaluate all the non operand element
        test = test.replace(/([^!<>=&%]+)/g, function () {
            var str = arguments[0];

            if (!str) return "";

            var fnToExec = str.match(/(\w+)\((.*)\)/);

            if (fnToExec) {
                var fn = fnToExec[1];
                var args = fnToExec[2];
                var tmp = [fn];
                var tmp2;

                if (args.indexOf(',') != -1) {
                    args = args.split(",");
                    args = args.map(function (item, index, array) {
                        tmp2 = parsePath(item, datas);
                        tmp.push(tmp2);
                    })
                    tmp.push(index);
                    args = tmp;
                    delete tmp;
                    delete tmp2;
                } else if (args.length) {
                    args = [fn, parsePath(fnToExec[2], datas), index];
                } else {
                    args = [fn, datas, index];
                }
                str = str.replace(fnToExec[0], evaluateFunction.apply(this, args));
            }

            var prop = parsePath(str, datas);

            if (typeof prop != "undefined" && prop !== null) {
                if (isNaN(parseInt(prop, 10))) {
                    return "'" + prop + "'";
                } else {
                    return parseFloat(prop, 10);
                }
            }
            // if string is already surrounded by quote (simple or double)
            // return the string
            else if (str.match(/(['"]).*?\1/)) {
                return str;
            }
            // if string is not surround by quote, add it before return;
            else {
                return "'" + str + "'";
            }
        });

        var ev;
        try {
            ev = cast(eval(test));

        } catch(err) {
            ev = false;
        }
        if (debugMode) {
            console.log("\nTEST: ----> ", test, "\nRESULT: -->", ev);
        }
        return ev;
    }

    function resolvePath(str, datas, type) {
        var outputDatas = datas;
        var path = subpath = null;

        switch (type) {
            case "property":
                // if str is a simple string -> datas[str]
                outputDatas = outputDatas[str];
                subpath = null;
                break;
            case "filter":
                var isIndex = str.match(/(\w+)?\[(\d+)\]/);
                var isPredica = str.match(/(\w+)?\[(.+)\]/);
                if (isIndex) {
                    // if path exists
                    if (isIndex[1]) {
                        outputDatas = outputDatas[isIndex[1]];
                    }
                    // if str contains an index --> property[2]
                    subpath = parseInt(isIndex[2], 10);
                } else if (isPredica) {
                    // if str contains a test --> =, !, >, <, %
                    outputDatas = outputDatas[isPredica[1]];
                    outputDatas = outputDatas.filter(function (item, index) {
                        var okko = evaluate(isPredica[2], item, index);
                        if (okko) {
                            return true;
                        }
                        return false;
                    });
                    subpath = null;
                }
                break;
            case "function":
                var isFunction = str.match(/(\w+)\((.*)\)/);
                outputDatas = evaluateFunction(isFunction[1], [parsePath(isFunction[2], datas)], 0);
                subpath = null;
                break;
        }

        /* output */
        if (subpath !== null) {
            try {
                return outputDatas[subpath];
            } catch(e) {
                throw "resolvePath() => undefined path: \"" + str + "\"";
            }
        }
        return outputDatas;
    }

    function parsePath(str, datas) {
        if (debugMode) {
            console.log("INPUT: ----> ", str);
        }
        if (!datas) datas = ORIGINAL_DATAS;
        str = str.replace(/^\./, "");
        var Fst = getFirstSubpath(str);
        var out = resolvePath(Fst.path, datas, Fst.type);
        // in some case, a last try is made with empty path
        if (!Fst.path.length) {
            out = datas;
        }
        // if the recursion is not finished
        else if (Fst.subpath) {
            out = parsePath(Fst.subpath, out);
        }
        // if it's a normal last
        else if (out) {
            out = out;
        } else if (typeof out == "undefined") {
            out = Fst.path;
        } else {
            // if path was not resolvable (case of string);
            console.warn("Warning: path \"" + Fst.path + "\" is not resolvable");
        }
        if (debugMode) {
            console.log("OUT: ----> ", out);
        }
        return out;

    }

    function cast(str) {
        switch (true) {
            case str == "true":
                str = true;
                break;
            case str == "false":
                str = false;
                break;
            case !isNaN(parseFloat(str, 10)):
                str = parseFloat(str, 10);
                break;
            default:
                break;
        }
        return str;
    }

    function getFirstSubpath(str) {
        var i = 0, out = {}, re;
        while (ch = str.charAt(i++)) {
            if (START_DELIMITER.indexOf(ch) != -1) {
                break;
            }
        }
        switch (ch) {
            case ".":
                out = {
                    path: str.slice(0, i - 1),
                    subpath:str.slice(i),
                    type: "property"
                }
                //out.path = out.path.replace(/^(["'])|\1$]/g, "");
                break;
            case "[":
                // TODO : nested case
                out = findCloseTag(str, '[', ']', "filter");
                break;
            case "(":
                // TODO : nested case
                out = findCloseTag(str, '(', ')', "function");
                break;
            default:
                out = {
                    path: str,
                    subpath: null,
                    type: "property"
                }
        }
        return out;
    }

    function fixEvalSyntax(path) {
        path = path.replace(/, +?/g, ",");
        path = protectSpace(path);
        path = path.replace(/ /g, "");
        path = path.replace(/([^!<>=])=([^!<>=])/g, "$1==$2");
        path = unprotectSpace(path);
        return path;
    }

    function protectSpace(str) {
        // protect space by replacing them by an uglyPattern
        str = str.replace(/(['"])(.*?)\1/g, function(str, gr1, gr2) {
            return gr2.replace(/ /g, UGLY_PATTERN_STR);
        });
        return str;
    }

    function unprotectSpace(str) {
        // protect space by replacing them by an uglyPattern
        str = str.replace(UGLY_PATTERN_RGX, " ");
        return str;
    }

    function findCloseTag(str, startChar, endChar, type) {
        var ioS = str.indexOf(startChar);
        var ioE = str.indexOf(endChar);
        return {
            path: str.slice(0, ioE + 1),
            subpath: str.slice(ioE + 1),
            type: type
        }
    }

    return function (datas) {
        ORIGINAL_DATAS = datas;
        return {
            find: parsePath,

            test : evaluate,

            addFilter: function (fnName, fn) {
                jsonQuery.fn[name] = fn;
                return this;
            }
        }
    }
})();

jsonQuery.fn = {
    // method with array, index as argumentsshould be call with no args

    first: function (array, index) {
        return array[0];
    },

    last: function (array, index) {
        return array[array.length - 1];
    },

    length: function (item) {
        if (typeof item.push != "function") {
            return 42;
        }
        return item.length;
    },

    isEven: function (prop) {
        return prop % 2 == 0;
    },

    isOdd: function (prop) {
        return prop % 2 != 0;
    },

    concat: function () {
        return Array.prototype.slice.call(arguments, 0).join('');
    }
};

if(global && module){
    module.exports = jsonQuery;
}