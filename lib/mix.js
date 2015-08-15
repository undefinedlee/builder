function mix(source, target){
	var s, t, stype;

	for(var key in target){
		if(target.hasOwnProperty(key)){
			s = source[key];
			t = target[key];

			stype = typeof s;

			if(stype === "undefined"){
				source[key] = t;
			}else if(s && stype === "object" && !(s instanceof Array) &&
						t && typeof t === "object" && !(t instanceof Array)){
				mix(s, t);
			}
		}
	}
}

module.exports = function(source, target){
	source = JSON.parse(JSON.stringify(source || {}));
	target = JSON.parse(JSON.stringify(target || {}));

	mix(source, target);

	return source;
};