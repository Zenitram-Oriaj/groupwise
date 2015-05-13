A simple node module for connecting to a Novell Groupwise Server using SOAP.
It was written primarily for the purpose of getting a "Resource" calendar's events to display on a touch panel outside a room.

13May2015:
Currently this module some basic functionality.  
It is a module that I will be updating daily (Mon-Fri) until it is completed.  

*NOTE: This is my very first public module, so it may have lots of issues and not well written. Its a learning process. 
Expect changes to how it operates to occur.*

Additional Documentation:
-------------------------
Novell GroupWise SOAP Service Documentation available at:
[Novell Website] (https://www.novell.com/developer/ndk/groupwise/groupwise_web_service_%28soap%29.html)


-------------------------

How To Use:
======================

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

-------------------------

GroupWise Methods:
======================
 
init()
-------------------------
Execute this method first before anything else:
```
var args = {
		server: '172.16.76.2',            // Required
		port:   '7191',                   // Required
		wsdl:   '../wsdl/groupwise.wsdl'  // Optional (Location of the Groupwise WSDL file)
	};
	gws.init(args, function (err, res) {
		if (err) {
			...
		} else {
			...
		}
	});
```
-------------------------

login()
-------------------------
Is used to authenticate to a POA.  
 Note: Trusted Application is currently not supported but will be coming soon.
 Note: Applications cannot log in to GroupWise resources. To access resources data, log in as the owner of the resource and then proxy into the resource.

```	
  var args = {		
    user: 'ao',       // Required	
    pass: '!boi123',  // Required		
    lang: 'en',       // Optional (Default: en)		
    version: '1.05'   // Optional (Default: 1.05)	
  };
	gws.login(args, function (err, res) {
		if (err) {
			...
		} else {
			...
		}
	});
```
-------------------------

proxyLogin()
-------------------------
 To login as an authorized proxy of another user's account. 
                You must first login is as the primary user before running the proxy login.
                Note: The domain and po will be automatically added to the proxy user.

```
  var args = {
		proxy: 'Conference Room 1'
	};
	gws.proxyLogin(args, function (err, res) {
		if (err) {
			...
		} else {
			...
		}
	});
```
---------------------

setSession()
-------------------------
  Sets the specific session you want to use.  By default, the primary account session id is used.
  The id is the unique key generated and stored in the return object from the proxyLogin method;
   
```
  var id = 's#df%#FR';
  gws.setSession(id,function(err,res){
    if(err){
      ...
   	} else {
   		...
   	}
  });
```
---------------------

logout()
-------------------------
  Will logout of the primary user's session. This will remove any and all proxy sessions
```
  gws.logout(function (err, res) {
  		if (err) {
  			...
  		} else {
  			...
  		}
  	});
```
---------------------

getFolders()
-------------------------
 Gets a list of folders.
```
  gws.getFolders(function (err, res) {
     if(err) {
       ...
     } else {
       ...
     }
   });
```
---------------------

getResources()
-------------------------
 Will return any item from the global address book that is marked as a resource.
```
   gws.getResources(function (err, res) {
     if(err) {
       ...
     } else {
       ...
     }
   });
```
---------------------

getProxyList()
-------------------------
 Will return an array of user objects that the current logged in user can proxy into.
```
  gws.getProxyList(function (err, res) {
    if(err) {
      ...
    } else {
       ...
    }
  });
```
---------------------

getUserFreeBusy()
-------------------------
 Returns a specified user's calendar events in between a start and end time frame.  
  *Here I want to get events between now and 3 days from now*
```
  var start = new Date();
  var end = new Date();
  end.setDate(start.getHours() + 3);
  var params = {
  	id: 'Conference Room 2',
  	start: start,
  	end: end
  };
  gws.getUserFreeBusy(user,start,end,function(err,res){
  	if(err){
  		...
  	} else {
  		...
  	}
  });
```
---------------------
 
getCalendar()
-------------------------
 Returns calendar events for the main calendar
```
  gws.getCalendar(function (err, res) {
  	if (err) {
  		...
  	} else {
  		...
  	}
  });
```
 If you want to filter your results, then use the opts object.  
 *Here I want to get events from 2 days ago and newer*
```
  var dt = new Date();
	dt.setDate(dt.getDate() - 2);
	var dts = gws.getDateTimeStr(dt);  
	var opts = {
		op: 'gt',                               // gt, lt, eq, contains
	  field: 'startDate',
	  value: dts
	};
	gws.getCalendar(opts, function (err, res) {
		if (err) {
	    ...
	  } else {
	    ...
	  }
	});
```
---------------------

createAppointment()
-------------------------
 Creates a new appointment and returns that appointments id.
```
 var params = {
 		subject: <string>,
 		message: <string>,
 		start: <date>,
 		end: <date>,
 		allDay: <bool>,
 		place: <string>'
 	};
 	gws.createAppointment(params,function(err,res){
 		if(err){
 			...
 		} else {
 			...
 		}
 	});
```
---------------------

updateAppointment()
-------------------------
 Updates an existing appointment.
```
 var params = {
 		id: <string>,             // Required
 		update: {
 		  <field>:<value>
 		},
 		add: {
 		  <field>:<value>
 		},
 		delete: {
 		  <field>:<value>
 		}
 	};
 	gws.updateAppointment(params,function(err,res){
 		if(err){
 			...
 		} else {
 			...
 		}
 	});
```
---------------------

removeAppointment()
-------------------------
 Removes an appointment from the calendar.
```
 var id = <string>
 	gws.removeAppointment(id,function(err,res){
 		if(err){
 			...
 		} else {
 			...
 		}
 	});
```
---------------------

getGlobalAddressBook()
-------------------------
  Returns the users accessible global address book.
```
  gws.getGlobalAddressBook(function (err, res) {
    if(err) {
      ...
    } else {
      ...
    }
  });
```
---------------------

getSettings()
-------------------------
 Returns the users settings.
```
  gws.getSettings(function (err, res) {
    if(err) {
      ...
    } else {
      ...
    }
  });
```

-------------------------
-------------------------

GroupWise Callbacks:
======================

On method callbacks, if there is an error, the error object this contain these parameters:
 - message: A general statement of the error
 - code: a number value representing the error.
 - subErr: If the error was produced by a dependency module, its error will be placed into here
 - params: Contains the parameters that was passed into the method.
 

-------------------------
-------------------------


GroupWise Events:
======================
 
Events generated by this module are as follows

Error:
-------------------------
```
	gws.on('error',function(err){
		// ...
	}): 
```

Response:
-------------------------
```
	gws.on('response', function(res){
		//...
	}):
```
 
 
