// 任务队列
var queue = module.exports = function(list, fn, onready){
	if(list.length){
		fn(list.shift(), function(){
			queue(list, fn, onready);
		});
	}else{
		onready && onready();
	}
};