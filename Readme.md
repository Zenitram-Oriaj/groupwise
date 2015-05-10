A simple node module for connecting to a Novell Groupwise Server using SOAP.
It was written primarily for the purpose of get a "Resource" calendar's events to display on a touch panel outside a room.

07May2015:
Currently this module is not fully functioning. It is a module that I will be updating daily (Mon-Fri) until it is completed.
NOTE: This is my very first public module, so it may have lots of issues and not well written. Its a learning process. 
Expect changes to how it operates to occur.

---------------------

How To Use:

(Note: you will need to have a git client installed prior, as the soap module being used it pulled directly from Github.)
```
npm install groupwise
```

In your app.js file:

```
var GWS = require('groupwise');
var gws = new GWS();
```
(Note: Currently, this module only supports one instance of the module.)

---------------------

Available Methods:
 
 - gws.init(): Execute this method first before anything else:
 ```
 var args = {
 		server: '172.16.76.2:7191' // The server IP and Port of the Groupwise Server
 	};
 
 	gws.init(args, function (err, res) {
 		if (err) {
 			console.error(err);
 		} else {
 			console.info(res);
 		}
 	});
 ```
 - gws.login(): Is used to authenticate to a POA. Trusted Application is currently not supported but will be coming soon.
 
 ```
 var args = {
 		user: 'ao',
 		pass: '!boi123'
 	};
 
 	gws.login(args, function (err, res) {
 		if (err) {
 			console.error(err);
 		} else {
 			console.info(res);
 		}
 	});
 ```
 
 - gws.proxyLogin(): To login as an authorized proxy of another user's account. 
                     You must first login is as the primary user before running the proxy login.
                     Note: The domain and po will be automatically added to the proxy user.
 
 ```
 var args = {
 		user: 'ao',
 		pass: '!boi123',
 		proxy: 'Conference Room 1'
 	};
 
 	gws.proxyLogin(args, function (err, res) {
 		if (err) {
 			console.error(err);
 		} else {
 			console.info(res);
 		}
 	});
 ```
 
 - gws.logout()
 
 ```
 gws.logout(function (err, res) {
  		if (err) {
  			console.error(err);
  		} else {
  			console.info(res);
  		}
  	});
 ```
 - gws.getFolders()
 - gws.getCalendar()
 - gws.getGlobalAddressBook()

On method callbacks, the error object this contain these parameters:
 - message: A general statement of the error
 - code: a number value representing the error.
 - subErr: If the error was produced by a dependency module, its error will be placed into here
 - params: Contains the parameters that was passed into the method.
 
 
Events generated by the modules are as follows

 - gws.on('error'): general error notification
 - gws.on('init'): notify that the soap client was created successfully
 - gws.on('login'): notify that the soap client has logged into the server as user
 - gws.on('proxy'): notify that the soap client has logged into the server as proxy
 - gws.on('logout'): notify that the soap client has logged out of the server
 
 
