/**
 * Created by Jairo Martinez on 5/12/15.
 */
var User = function(){
	this.info = {
		name:       '',
		email:      '',
		uuid:       '',
		userid:     '',
		domain:     '',
		postOffice: '',
		fid:        ''
	};
	this.creds = {
		user:    '',
		pass:    '',
		proxy:   '',
		lang:    'en',
		version: '1.05'
	};

	this.proxies = [];
	this.folders = [];
	this.session = '';
	this.loggedIn = false;
};

module.exports = User;