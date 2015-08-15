module.exports = function(str){
    return str && (typeof str === "string") ? str.replace(/[<>&"]/g, function(target){
        return {
        	"&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;"
        }[target];
    }) : str;
};