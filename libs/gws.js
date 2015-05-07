/**
 * Created by Jairo Martinez on 5/7/15.
 */

/**
 * Created by Jairo Martinez on 5/7/15.
 */
var soap = require('soap');
var path = require('path');
var events = require('events');
var util = require('util');

var cursor = require('./cursor');

var url = path.join(__dirname, '../wsdl/groupwise.wsdl');
var endpoint = 'http://localhost:7191/soap';
var client = {};
var sessionId = '';
var loggedIn = false;

var ErrObj = function () {
	this.message = '';
	this.params = {};
	this.err = {};
};

var GWS = function () {
	events.EventEmitter.call(this);
};

util.inherits(GWS, events.EventEmitter);

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

function GetAddressBookList() {
	var args = {};

	client.getAddressBookListRequest(args, function (err, res) {
		if (err) {
			console.error(err);
			cb(err, null);
		} else {
			cb(null, res);
		}
	});
}

function getFolderList(cb) {
	var args = {
		parent:  'folders',
		recurse: true,
		imap:    false,
		nntp:    false
	};

	client.getFolderListRequest(args, function (err, res) {
		if (err) {
			cb(err, null);
		} else {
			cb(null, res.folders.folder);
		}
	});
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Public Methods

GWS.prototype.GetAddressBooks = function (cb) {

};

GWS.prototype.GetAddressBook = function (id, cb) {

};

GWS.prototype.GetFolders = function (cb) {
	getFolderList(function (err, res) {
		if (err) {
			cb(err, null);
		} else {
			var id = '';

			res.forEach(function (item) {
				if (item.folderType === 'Calendar') {
					id = item.id;
				}
			});
		}
	});
};

GWS.prototype.GetItems = function (cb) {
	var e = new ErrObj();
};

GWS.prototype.GetItem = function (id, cb) {
	var e = new ErrObj();
};

GWS.prototype.GetCalendar = function (cb) {
	var e = new ErrObj();

	getFolderList(function (err, res) {
		if (err) {
			e.message = 'Failed To Get Folder List For Calendar';
			e.err = err;

			cb(e, null);
		} else {
			var id = '';
			res.forEach(function (item) {
				if (item.folderType === 'Calendar') {
					id = item.id;
				}
			});

			if(id){
				cursor.retrieve(client,id,function(err,res){
					if(err){

					} else {

					}
				});
			}
		}
	});
};

GWS.prototype.init = function (opts, cb) {
	var self = this;
	var e = new ErrObj();

	if (opts && opts.server) {
		endpoint = 'http://' + opts.server + '/soap';
	}
	if (opts && opts.wsdl) {
		url = opts.wsdl;
	}

	soap.createClient(url, function (err, c) {
		if (err) {
			e.message = 'Failed To Create SOAP Client';
			e.err = err;
			cb(e, null);
		} else {
			client = c;
			client.setEndpoint(endpoint);

			self.emit('init',{});

			cb(null, {
				message: 'Successfully Created Service Client'
			})
		}
	});
};

GWS.prototype.login = function (params, cb) {
	var e = new ErrObj();

	if (params && params.user && params.pass) {
		var args = {
			auth:     {
				attributes: {
					'xsi_type': {
						xmlns: 'types',
						type:  'PlainText'
					}
				},
				username:   params.user,
				password:   params.pass
			},
			language: 'en',
			version:  '1.05',
			userid:   true
		};

		client.loginRequest(args, function (err, res) {
			if (err) {
				e.message = 'Failed To Login';
				e.err = err;
				e.params = params;
				cb(e, null);
			} else {
				sessionId = res.session;
				loggedIn = true;
				client.addSoapHeader('<session xmlns="http://schemas.novell.com/2005/01/GroupWise/types">' + sessionId + '</session>');
				self.emit('login', res);
				cb(null, res.userinfo);
			}
		});
	} else {
		e.message = 'Missing or Incorrect Parameters.';
		e.params = params;
		cb(e, null);
	}
};

GWS.prototype.logout = function (cb) {
	var e = new ErrObj();

	if (loggedIn) {
		var args = {};
		client.logoutRequest(args, function (err, res) {
			if (err) {
				var e = {
					message: 'Failed To Logout',
					err:     err
				};
				cb(e, null);
			} else {
				sessionId = '';
				loggedIn = false;
				client.clearSoapHeaders();
				cb(null, res.userinfo);
			}
		});
	} else {
		e.message = 'Not Logged In To Server';
		cb(e, null);
	}

};

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

module.exports = GWS;