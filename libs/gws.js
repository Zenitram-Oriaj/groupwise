/**
 * Created by Jairo Martinez on 5/7/15.
 */

var soap = require('soap');
var path = require('path');
var events = require('events');
var	util = require('util');

var url = path.join(__dirname, './wsdl/groupwise.wsdl');
var client = {};
var sessionId = '';
var loggedIn = false;

var gws = {
	folders: [],
	books:   []
};

var GWS = function(wsdl, endpoint, options){
	events.EventEmitter.call(this);

	options = options || {};
	this.wsdl = wsdl;
	this.client = {};
	this.sessionId = '';
	this.loggedIn = false;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

function CreateClient(cb) {
	soap.createClient(url, function (err, c) {
		if (err) {
			cb(err, null);
		} else {
			cb(null, c);
		}
	});
}

function ClientLogin(user, pass, cb) {
	var args = {
		auth:     {
			attributes: {
				'xsi_type': {
					xmlns: 'types',
					type:  'PlainText'
				}
			},
			username:   user,
			password:   pass
		},
		language: 'en',
		version:  '1.05',
		userid:   true
	};

	client.loginRequest(args, function (err, res) {
		if (err) {
			console.error(err);
		} else {
			console.error('////////////////////////////////////////////////////////');
			console.log(res);
			cb(null, res);
		}
	});
}

function ClientLogOut(cb) {
	var args = {};

	client.logoutRequest(args, function (err, res) {
		if (err) {
			console.error(err);
		} else {
			console.error('////////////////////////////////////////////////////////');
			console.log(res);
			cb(null, res);
		}
	});
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
	args =  args || {
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
							cb(null,dat);
						}
					});
				}
			})
		}
	});
}

function GetAddressBooks(cb) {

}

function GetAddressBook(id, cb) {

}

function GetFolders(cb) {
	GetFolderList(function (err, res) {
		if (err) {
			cb(err,null);
		} else {
			var id = '';

			res.forEach(function (item) {
				if (item.folderType === 'Calendar') {
					id = item.id;
				}
			});
		}
	});
}

function GetItems(cb) {

}

function GetItem(id, cb) {

}

function GetCalendar(cb) {

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//

CreateClient(function (err, c) {
	if (err) {
		console.error('---------INIT ERROR----------');
		console.error(err);
	} else {
		client = c;
		client.setEndpoint('http://boi.selfip.com:7191/soap');

		ClientLogin('ao', '!boi123', function (err, res) {
			if (err) {
				console.error(err);
			} else {
				sessionId = res.session;
				loggedIn = true;
				client.addSoapHeader('<session xmlns="http://schemas.novell.com/2005/01/GroupWise/types">' + sessionId + '</session>');

			}
		});
	}
});