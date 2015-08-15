var pathMod = require("path");
var removeExt = require("./remove-ext");
var defaultGroup = require("../../config/config")()["default-group"];
// 解析模块依赖
var REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g
var SLASH_RE = /\\\\/g


var DIRNAME_RE = /[^?#]*\//
// Extract the directory portion of a path
// dirname("a/b/c.js?t=123#xx/zz") ==> "a/b/"
// ref: http://jsperf.com/regex-vs-split/2
function dirname(path) {
  return path.match(DIRNAME_RE)[0]
}

var DOT_RE = /\/\.\//g
var MULTIPLE_SLASH_RE = /([^:\/])\/\/+/g
var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//g

// Canonicalize a path
// realpath("http://test.com/a//./b/../c") ==> "http://test.com/a/c"
function realpath(path) {
  // /a/b/./c/./d ==> /a/b/c/d
  path = path.replace(DOT_RE, "/")

  // "file:///a//b/c"  ==> "file:///a/b/c"
  // "http://a//b/c"   ==> "http://a/b/c"
  // "https://a//b/c"  ==> "https://a/b/c"
  // "/a/b//"          ==> "/a/b/"
  path = path.replace(MULTIPLE_SLASH_RE, "$1\/")

  // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
  while (path.match(DOUBLE_DOT_RE)) {
    path = path.replace(DOUBLE_DOT_RE, "/")
  }

  return path
}


function getType(path){
	if(/^(\.){1,2}\//.test(path)){
		// 相对路径
		return "relative";
	}else if(/^[\w\-:]+$/.test(path)){
		// 模块名
		return "module-name";
	}else{
		// 普通模块
		return "normal";
	}
}

function transModName(type, name){
	// 非相对地址，缺省命名空间的，默认为lib
	if(type !== "relative" && name.indexOf(":") === -1){
		name = defaultGroup + ":" + name;
	}
	// 转换命名空间连接符
	name = name.replace(/:/g, "/");
	// 如果是模块名，则追加默认index入口文件路径
	if(type === "module-name"){
		return name + "/index";
	}
	return name;
}


module.exports = {
	get: function(code) {
		var deps = [];

		code.replace(SLASH_RE, "")
			.replace(REQUIRE_RE, function(all, quotationMarks, name) {
				var type = getType(name),
					positionName;
				if (name) {
					positionName = transModName(type, name);
		    		deps.push({
		    			type: type,
		    			originName: name,
		    			name: positionName,
		    			viewName: removeExt(positionName)
		    		});
		    	}
			});

		return deps;
	},
	replace: function(code, deps){
		var hash = {};
		deps.forEach(function(item){
			hash[item.originName] = item;
		});

		return code.replace(SLASH_RE, "____placeholder____")
			.replace(REQUIRE_RE, function(all, quotationMarks, name) {
				var item;
				if(name && (item = hash[name])){
					return all.replace(name, item.viewName);
				}

				return all;
			})
			.replace(/____placeholder____/g, "\\\\");
	}
};