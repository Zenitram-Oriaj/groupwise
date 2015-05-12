/**
 * Created by Jairo Martinez on 5/11/15.
 */
var Proxy = function () {
	this.session = '';
	this.uid = '';
	this.folders = [];

	this.info = {
		name: '',
		email: '',
		uuid: '',
		userid: ''
	};

	this.entry = {
		displayName: '',
		email:       '',
		uuid:        '',
		appointment: {read: '0', write: '0'},
		mail:        {read: '0', write: '0'},
		misc:        {alarms: '0', notify: '0', readHidden: '0', setup: '0'},
		note:        {read: '0', write: '0'},
		task:        {read: '0', write: '0'}
	};
};

module.exports = Proxy;