// TODO: add %
// TODO: add !
// TODO: cast

log = function () {
    //return console.log.apply(this, arguments);
}

function test(){
    console.log(arguments);
    if(Math.round(Math.random()*1000)%2) return false;
    return true;
}

function first(array) {
    return array[0];
}
function last(array) {
    return array[array.length - 1];
}

function getInitial(name) {
    if (typeof name.split != "function") return false;
    var sp = name.split(" ");
    return sp[0][0] + sp[1][0];
}

function concat() {
    var args = Array.prototype.slice.call(arguments, 0);
    return args.join("");
}

function double(val) {
    return val * 2;
}

function length(item) {
    return item.length;
}

function float(str) {
    return parseFloat(str.replace(/["']*/, "").replace(",", "."));
}

function isEven(uid) {
    return uid % 2 == 0;
}

function exists(prop, src, index) {
    return typeof prop != "undefined" && prop != null;
}


var DATAS = {
    title:"My Title",
    id: "oneDoc",
    uid: 100,
    userID: "abc123",
    prop1: {
        prop2: {
            prop3: "42"
        }
    },

    store: {

        users: [
            {
                id: "abc123",
                uid:1,
                name:"Usain Bolt",
                hobbies: ["athletism"],
                role: "admin"
            },
            {
                id: "def456",
                uid:2,
                name:"Michael Jordan",
                hobbies: ["basket", "baseball", "beachVolley"]
            },
            {
                id: "ghi789",
                uid:3,
                name:"Alain Robert",
                hobbies: ["climbing", "cricket", "curling"]
            },
            {
                id: "klm012",
                uid:4,
                name:"Jacques Mayol",
                hobbies: ["diving", "dining"]
            }
        ]
    }

};


/* jsonQuery */
jsonQuery = (function () {

    var ORIGINAL_DATAS = {};

    function evaluateFunction(fnName, args, index) {
        if (fnName == "position") {
            return index;
        }
        try {
            return eval(fnName).apply(this, (typeof args.push == "function") ? args : [args]);
        }
        catch(e) {
            log(fnName, args)
            // a method of native is called
            return eval("'" + args[0] + "'." + fnName + "()");
        }

    }

    function evaluate(test, datas, index) {
        if (!datas) datas = ORIGINAL_DATAS;
        // fix syntax
        // = en ==, gestion des quotes
        // regexp function()
        // en i--, replace fn par sa valeur de retour
        // predica
        // store predicate


        test = fixEvalSyntax(test);

        // try to evaluate all the non operand element
        var test = test.replace(/([^!<>=&]+)/g, function () {
            var str = arguments[0];

            if (!str) return "";

            var fnToExec = str.match(/(\w+)\((.*)\)/);

            if (fnToExec) {
                var fn = fnToExec[1];
                var args = fnToExec[2];



                if (args.indexOf(',') != -1) {
                    args = args.split(",");
                    args = args.map(function (item, index, array) {
                        return parsePath(item, datas);
                    })
                }
                else if(args.length) {
                    args = parsePath(fnToExec[2], datas);
                }
                else {
                    args = [datas, index];
                }

                str = str.replace(fnToExec[0], evaluateFunction(fn, args, index));
            }

            var prop = parsePath(str, datas);
            if (typeof prop != "undefined" && prop !== null) {


                if (isNaN(parseInt(prop, 10))) {
                    return "'" + prop + "'";
                }
                else {
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
            ev = eval(test);

        }
        catch(err) {
            ev = false;
        }
        log("\n     ------------------------------> ", test, "-->", ev, "\n");
        return ev;
    }

    function fixEvalSyntax(path) {
        return path.replace(/([^!<>=])=([^!<>=])/g, "$1==$2").replace(/ /g, "");
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
                }
                else if (isPredica) {
                    // if str contains a test --> =, !, >, <, %
                    outputDatas = outputDatas[isPredica[1]];
                    outputDatas = outputDatas.filter(function (item, index) {
                        if (evaluate(isPredica[2], item, index || 0)) {
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
            }
            catch(e) {

                throw "undefined path: \"" + str + "\"";
            }

        }
        return outputDatas;
    }

    function parsePath(str, datas) {
        log("**************************************");
        if (!datas) datas = ORIGINAL_DATAS;
        str = str.replace(/^\./, "");
        log("parsePath:", str);
        var Fst = getFirstSubpath(str);
        log("path/subpath:", Fst);
        var out = resolvePath(Fst.path, datas, Fst.type);
        // in some case, a last try is made with empty path
        if (!Fst.path.length) {
            return datas;
        }
        // if the recursion is not finished
        else if (Fst.subpath) {
            return parsePath(Fst.subpath, out);
        }
        // if it's a normal last
        else if(out){
            console.log("\n-------------------------------------\n")
            return out;
        }
        // if path was not resolvable (case of string);
        console.warn("Warning: path \""+Fst.path+"\" is not resolvable");
        return Fst.path;

    }

    var START_DELIMITER = [".", "[", "(", "'", '"'];
    var END_DELIMITER = ["]", ")","'", '"'];

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
        out.path = out.path.replace(/^["']|["']$/g, "");
        return out;
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

            eval : evaluate
        }
    }

})();


var Start = (new Date);

/* OK: log(jsonQuery.parse("title", DATAS, true));*/
/* OK: log(jsonQuery.parse("store.users", DATAS, true));*/
/* OK: log(jsonQuery.parse("store.users[1]", DATAS, true));*/
/* OK:  throw error cause path not exist, log(jsonQuery.parse("users[1]", DATAS, true));*/
/* OK: log(jsonQuery.parse("store.users[uid=2]", DATAS, true));*/
/* OK: log(jsonQuery.parse("store.users[uid>2]", DATAS, true));*/
/* OK: log(jsonQuery.parse("store.users[1].hobbies", DATAS, true));*/
/* OK: log(jsonQuery.parse("prop1.prop2.prop3", DATAS, true));*/
/* OK: log(jsonQuery.parse("store.users[getInitial(name) == 'MJ']", DATAS, true));*/
/* OK: log(jsonQuery.parse("store.users[length(hobbies) = 3]", DATAS, true));*/
//OK: log(jsonQuery.parse("length(store.users)", DATAS, true));
/* KO: log("result:",jsonQuery.parse("store.users[isEven(uid)]", DATAS, true));*/
/* OK: log("result:",jsonQuery.parse("store.users[position() > 2]", DATAS, true));*/
/* OK: log("result:",jsonQuery.parse("store.users[length(hobbies)=2]", DATAS, true));*/
/* OK: log("result:",jsonQuery.parse("store.users[length(hobbies)>2]", DATAS, true));*/
/* KO: log("result:",jsonQuery.parse("store.users[exists(role)]", DATAS, true));*/
/* OK: log("\n\nresult:",jsonQuery.parse("store.users[length(hobbies)=1]", DATAS, true));*/
/* KO:  jsonQuery.parse("store.users[uid=1 && length(name) > 2].first().name", DATAS);*/
/* OK: log("\n\n-----> Should return the whole datas:\n\n",jsonQuery.parse("", DATAS));*/
/* OK: log("\n\n-----> Should return the value passed:\n\n",jsonQuery.parse("12", DATAS));*/
/* OK: log("\n\n-----> Should return the value passed:\n\n",jsonQuery.parse("prop1", DATAS));*/
/* KO:  should return a string /log("\n\n-----> Should return the array passed:\n\n",jsonQuery.parse("'store'", DATAS));*/

var $json =jsonQuery(DATAS), i=1;
for (var i = 0; i < 1; i++) {
    /*console.log($json.find("store"));
    console.log($json.find("store.users"));
    console.log($json.find("store.users[2]"));
    console.log($json.find("store.users[uid>1]"));
    console.log($json.find("store.users[uid>1].last()"));
    console.log($json.find("store.users[uid>1].last().name"));
    console.log($json.find("store.users[uid>1].last().name.getInitial()"));*/
    console.log("\n_______________________________________\n");
    console.log($json.find("store.users[test() = true]")); // args will be [datas, index];
    continue;
    $json.find("store.users[test(name)]"); // args will be [name];
    $json.find("store.users[test(name, id)]");// args will be [name, id];
    $json.find("store.users[test(name, id, hobbies)]");// args will be [name, id];
}
var End = (new Date);
var Delta = End - Start;
console.log("\nExecuted in " + Delta + 'ms for '+i+" iteration. ("+Delta/i+"ms)");


