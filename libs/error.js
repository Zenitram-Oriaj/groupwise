/**
 * Created by Jairo Martinez on 5/10/15.
 */

module.exports.obj = function () {
	this.message = '';
	this.code = 0;
	this.params = {};
	this.subErr = {};
};

module.exports.getParamError = function(params) {
	if(params){

		if(!params.user
		  || params.user.length < 1
		) return 'Please Enter A User Name';

		if(!params.pass
			|| params.pass.length < 1
		) return 'Please Enter A Password';

		return 'Unknown Error Occurred';
	} else {
		return 'No Parameter Object Was Passed Into Method';
	}
};
