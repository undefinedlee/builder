var Index = [],
	i;
// 数字
for(i = 48; i < 58; i ++){
	Index.push(String.fromCharCode(i));
}
// // 大写（由于用于版本号，URL地址不区分大小写，所以不用大写）
// for(i = 65; i < 91; i ++){
// 	Index.push(String.fromCharCode(i));
// }
// 小写
for(i = 97; i < 123; i ++){
	Index.push(String.fromCharCode(i));
}
var Hash = {};
var hex = 36;
for(i = 0; i < hex; i ++){
	Hash[Index[i]] = i;
}

var Hex = module.exports = function(num){
	if(num == 0)
		return "0";

	var result = [],
		item = 1;
	while(num >= item){
		result.unshift(Index[(num % (item * hex)) / item | 0]);
		item *= hex;
	}
	return result.join("");
};

Hex.to10 = function(num){
	var result = 0;

	for(var i = 0, l = num.length; i < l; i ++){
		result += Hash[num.charAt(i)] * Math.pow(hex, l - i - 1);
	}

	return result;
};