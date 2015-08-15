var path = require("path");
var fs = require("fs");

// 创建所有目录
var mkdirs = module.exports = function(dirpath, callback) {
    if(callback){
        fs.exists(dirpath, function(exists) {
            if(exists) {
                    callback(dirpath);
            } else {
                    //尝试创建父目录，然后再创建当前目录
                    mkdirs(path.dirname(dirpath), function(){
                            fs.mkdir(dirpath, callback);
                    });
            }
        });
    }else{
        if(fs.existsSync(dirpath)){
            return true;
        }else{
            if(mkdirs(path.dirname(dirpath))){
                fs.mkdirSync(dirpath);
                return true;
            }
        }
    }
};