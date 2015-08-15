var crypto = require('crypto');

module.exports = function(data){
	var sha1 = crypto.createHash('sha1');
	sha1.update(data);
	return sha1.digest('hex');
};