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

function findKey(obj, val) {
	for (var n in obj) {
		if (obj[n] === val)
			return n;
	}
	return null;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

function CreateCursor(id, cb) {
	var args = {
		container: id
	};

	client.createCursorRequest(args, function (err, res) {
		if (err) {
			console.error(err);
			cb(err, null)
		} else {
			cb(null, res);
		}
	});
}

function CreateCursorWithFilter(args, id, cb) {
	args = args || {
			container: id,
			filter:    {
				element: {
					attributes: {
						type: "FilterEntry"
					},
					field:      'modified',
					value:      new Date(),
					date:       'Today'
				}
			}
		};

	client.createCursorRequest(args, function (err, res) {
		if (err) {
			console.error(err);
			cb(err, null)
		} else {
			cb(null, res);
		}
	});
}

function ReadCursor(id, csr, cnt, cb) {
	var args = {
		container: id,
		cursor:    csr,
		forward:   false,
		position:  'end',
		count:     cnt
	};

	client.readCursorRequest(args, function (err, res) {
		if (err) {
			console.error(err);
			cb(err, null)
		} else {
			console.error('////////////////////////////////////////////////////////');
			console.info(res.items.item);
			cb(null, res.items.item);
		}
	});
}

function DeleteCursor(id, csr, cb) {
	var args = {
		container: id,
		cursor:    csr
	};

	client.destroyCursorRequest(args, function (err, res) {
		if (err) {
			console.error(err);
			cb(err, null)
		} else {
			cb(null, res);
		}
	});
}

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

function GetFolderList(cb) {
	var args = {
		parent:  'folders',
		recurse: true,
		imap:    false,
		nntp:    false
	};

	client.getFolderListRequest(args, function (err, res) {
		if (err) {
			console.error(err);
			cb(err, null);
		} else {
			cb(null, res.folders.folder);
		}
	});
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Public Methods

function Collect(id, cb) {
	var csr = 0;
	var dat = {};

	CreateCursor(id, function (err, res) {
		if (err) {
			cb(err, null);
		} else {
			csr = res.cursor;
			ReadCursor(id, csr, 5, function (err, res) {
				if (err) {
					cb(err, null);
				} else {
					dat = res;
					DeleteCursor(id, csr, function (err, res) {
						if (err) {
							cb(err, null);
						} else {
							cb(null, dat);
						}
					});
				}
			})
		}
	});
}

GWS.prototype.GetAddressBooks = function (cb) {

};

GWS.prototype.GetAddressBook = function (id, cb) {

};

GWS.prototype.GetFolders = function (cb) {
	GetFolderList(function (err, res) {
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