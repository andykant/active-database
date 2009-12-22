/*
Active Database (ADb)
--------------------------------
Copyright:  Copyright (c) 2006-2009 Andy Kant, http://andykant.com/
Website:    http://github.com/andykant/active-database
License:    MIT-style license
Version:    1.0.0.20
--------------------------------
Credits:
- ADb.$type is based on $type from mootools.js 
  <http://mootools.net> (c) Valerio Proietti, MIT-style license.
- ADb.$xfn is equivalent to $xfn from xfn.js 
  <http://github.com/andykant/extended-function-factory> (c) Andy Kant, 
  MIT-style license.
--------------------------------
About:
- ADb is a relational database system implemented in JavaScript.
- ADb's implementation is based on the ActiveRecord design pattern.
*/

// Create ADb class.
var ADb = function(tables) {
	// Alias for creating a new database.
	return new ADb.Database(tables);
};

/*
Static Methods:
	$array      - Create a copy of an array.
	$bind       - Binds an object's context to the 'this' pointer in a function.
	$each       - Iterate through each object in an array.
	$error      - Generates a database error.
	$export     - Serializes an object into a string.
	$extend     - Extend an object's properties.
	$generator  - Default value function generator.
	$import     - Imports a serialized string into an object.
	$index      - Returns the index of an object in an array.
	$init       - Lists all names in an array as a string of variable initialization directives.
	$test       - Tests a datatype to ensure that it is acceptable for database storage.
	$type       - Finds the type of an object.
	$validate   - Validates an object as being of the specified type.
Static Factories:
	$ext        - Initializes a new extension cache.
	$observer   - Implements an observer pattern, used for event listening.
	$ref        - A placeholder data reference used to reference a foreign key before it might be created.
	$xfn        - Converts a function to an extended function.
Static Properties:
	$debug      - (boolean) Whether or not debug mode is enabled (defaults to 'false').
	$extensions - (object) A hashtable for extensions to cache data.
	$version    - (string) The current version of the library.
*/
ADb.$debug = false;
ADb.$version = '1.0.0.20';
ADb.$extensions = {};

/*
Static Method: $array
	Create a copy of an array.
Arguments:
	arr     - (array) Array to copy.
Returns:
	(array) - Copied array object.
Usage:
	ADb.$each(ADb.$array(arguments), function(obj, i) {
		some_arr[i] = obj;
	});
*/
ADb.$array = function(arr) {
	var tmp = [];
	for (var i = 0; i < arr.length; i++)
		tmp.push(arr[i]);
	return tmp;
};

/*
Static Method: $bind
	Binds an object's context to the 'this' pointer in a function.
Arguments:
	fn         - (function) The function to alter.
	ctx        - (object) The context to bind.
Returns:
	(function) - The new bound function.
Usage:
	var fn = ADb.$bind(function(arg1, arg2) {
		this.property = arg1 + arg2;
	}, this);
*/
ADb.$bind = function(fn, ctx) {
	return function(){
		return fn.apply(ctx, arguments);
	};
};

/*
Static Method: $each
	Iterate through each object in an array.
Arguments:
	obj - (array/object) Object to iterate through.
	fn  - (function) Function to execute for each iteration.
				Will be passed object and iterator values.
	ctx - <OPTIONAL> (object) Context to run function with.
Usage:
- General use.
		ADb.$each(arguments, function(arg, i) {
			some_arr[i] = arg;
		}, this);
- Iterating over an array.
		ADb.$each(arr, function(some_obj, idx) {
			alert(idx + ': ' + some_obj);
		}, this);
- Iterating over an object.
		ADb.$each(obj, function(some_obj, hash) {
			alert(hash + ': ' + some_obj);
		}, this);
- Iterating over an unknown object type.
		ADb.$each(obj, function(some_obj) {
			alert(some_obj);
		}, this);
*/
ADb.$each = function(obj, fn, ctx) {
	ctx = ctx || null;
	if (ADb.$type(obj) == 'array') {
		for (var i = 0; i < obj.length; i++) {
			var result = fn.call(ctx, obj[i], i);
			if (ADb.$type(result)) return result;
		}
	} else if (ADb.$type(obj) == 'object') {
		for (var i in obj) {
			var result = fn.call(ctx, obj[i], i);
			if (ADb.$type(result)) return result;
		}
	} else if (ADb.$type(obj)) {
		var result = fn.call(ctx, obj, null);
		if (ADb.$type(result)) return result;
	}
};

/*
Static Method: $error
	Generates a database error.
Arguments:
	message - (string) The message to append to the error string.
Usage:
	ADb.$error('Invalid datatype.');
*/
ADb.$error = function(message) {
	if (ADb.$debug) {
		if (typeof console != 'undefined')
			console.error('ADb Error: ' + message);
		else
			throw(new Error('ADb Error: ' + message));
	}
};

/*
Static Method: $export
	Serializes an object into a string.
Arguments:
	obj      - (object) The object to serialize.
	force    - <OPTIONAL> (boolean) Forces the object to serialize via the 'toString' object method.
Returns:
	(string) - If an object is serializable, defined as it would be evaluated to a JavaScript object.
	'null'   - (string) If an object isn't serializable.
Usage:
	var date_obj = new Date();
	var date_string = ADb.$export(date_obj);
	if (date_obj == ADb.$import(date_string)) {
		...
	}
*/
ADb.$export = function(obj, force) {
	var type = ADb.$type(obj);
	force = force || false;
	if (force || type.match(/^(auto|regexp|boolean|number)$/)) return obj.toString();
	else if (type == 'date') return "new Date('" + obj.toString() + "')";
	else if (type == 'string') return "'" + obj + "'";
	else if (type == 'array') {
		var arr_str = [];
		arr_str.push('[');
		for (var i = 0; i < obj.length; i++) {
			if (i > 0)
				arr_str.push(',');
			arr_str.push(ADb.$export(obj[i]));
		}
		arr_str.push(']');
		return arr_str.join('');
	} else if (type == 'object') {
		var obj_str = [];
		obj_str.push('{');
		var first = true;
		for (var i in obj) {
			if (!first)
				obj_str.push(',');
			obj_str.push("'" + i + "':" + ADb.$export(obj[i]));
			if (first)
				first = false;
		}
		obj_str.push('}');
		return obj_str.join('');
	} else {
		return 'null';
	}
};

/*
Static Method: $extend
	Extend an object's properties.
Arguments:
	base     - (object) Object to overwrite properties of.
	extender - (object) Object whose properties should be used to overwrite.
	xfn      - <OPTIONAL> (boolean) Whether to convert functions to extended functions.
Usage:
	var options = {
		name: 'options',
		value: 37
	};
	ADb.$extend(options, {name: 'error', message: 'failure'});
	// options = {name: 'error', message: 'failure', value: 37};
*/
ADb.$extend = function(base, extender, xfn) {
	xfn = xfn || false;
	for (name in extender) {
		if (xfn && ADb.$validate('function', extender[name]))
			base[name] = ADb.$xfn(extender[name]);
		else
			base[name] = extender[name];
	}
};

/*
Static Method: $generator
	Default value function generator.
Arguments:
	type       - (string) The datatype to produce a generator for.
Returns:
	(function) - Generator for the object type.
Generators:
	'auto'     - Returns -1 (number).
	'function' - Returns an empty function.
	'textnode' - Returns an empty textnode.
	'element'  - Returns an empty 'div' element.
	'date'     - Returns the current date/time.
	'array'    - Returns an empty array.
	'regexp'   - Returns a wildcard regular expression.
	'object'   - Returns an empty object.
	'string'   - Returns an empty string.
	'boolean'  - Returns false.
	'number'   - Returns 0.
Usage:
	var default_string = ADb.$generator('string')();
	var default_number = ADb.$generator('number')();
	var default_date = ADb.$generator('date')();
*/
ADb.$generator = function(type) {
	if (type == 'auto') return function(){return -1;};
	else if (type == 'function') return function(){return function(){};};
	else if (type == 'textnode') return function(){return document.createTextNode('');};
	else if (type == 'element') return function(){return document.createElement('div');};
	else if (type == 'date') return function(){return new Date();};
	else if (type == 'array') return function(){return [];};
	else if (type == 'regexp') return function(){return /^.*$/;};
	else if (type == 'object') return function(){return {};};
	else if (type == 'string') return function(){return '';};
	else if (type == 'boolean') return function(){return false;};
	else if (type == 'number') return function(){return 0;};
	else return function(){return null;};
};

/*
Static Method: $import
	Imports a serialized string into an object.
Arguments:
	data     - (string) The string to evaluate into an object.
Returns:
	(object) - If a string is deserializable.
	(null)   - If a string isn't deserializable.
Usage:
	var date_obj = new Date();
	var date_string = ADb.$export(date_obj);
	if (date_obj == ADb.$import(date_string)) {
		...
	}
*/
ADb.$import = function(data) {
	return eval('(' + data + ')');
};

/*
Static Method: $index
	Returns the index of an object in an array.
Arguments:
	arr      - (array) Array to iterate.
	obj      - (object) Object to look for.
Returns:
	(number) - Index in the array.
	-1       - (number) If the object does not exist in the array.
Usage:
	var idx = ADb.$index('red');
*/
ADb.$index = function(arr, obj) {
	if (ADb.$validate('function', arr.indexOf)) {
		return arr.indexOf(obj);
	} else {
		for (var i = 0; i < arr.length; i++) {
			if (arr[i] == obj)
				return i;
		}
		return -1;
	}
};

/*
Static Method: $init
	Lists all names in an array as a string of variable initialization directives.
Arguments:
	vars     - (array[string]) Array of private variable names to evaluate.
Returns:
	(string) - String to be evaluated to define environment methods.
Usage:
	eval(ADb.$init(this.$expose('__')));
*/
ADb.$init = function(vars) {
	vars = vars || [];
	var init = [];
	for (var i = 0; i < vars.length; i++)
		init.push("var " + vars[i] + " = this.$expose('" + vars[i] + "');");
	return init.join('');
};

/*
Static Method: $test
	Tests a datatype to ensure that it is acceptable for database storage.
Arguments:
	type  - (string) The datatype to test.
	isKey - <OPTIONAL> (boolean) Whether the datatype is being used for a key.
Returns:
	true  - (boolean) If the datatype is valid.
	false - (boolean) If the datatype is invalid.
Usage:
- Test for a valid datatype:
		if (ADb.$test('number')) {
			...
		}
- Test for a valid datatype for a key:
		if (ADb.$test('string', true) {
			...
		}
*/
ADb.$test = function(type, isKey) {
	if (isKey)
		return /^(auto|string|number)$/.test(type);
	else
		return /^(auto|function|textnode|element|date|array|regexp|object|string|boolean|number)$/.test(type);
};

/*
Static Method: $type
	Finds the type of an object.
	Based on $type in mootools.js <http://mootools.net> (c) Valerio Proietti, MIT-style license.
Arguments:
	obj            - (object) The object to find the type of.
Returns:
	'function'     - (string) If obj is a function.
	'textnode'     - (string) If obj is a node but not an element.
	'element'      - (string) If obj is a DOM element.
	'date'         - (string) If obj is a date.
	'array'        - (string) If obj is an array.
	'regexp'       - (string) If obj is a regular expression.
	'object'       - (string) If obj is an object.
	'string'       - (string) If obj is a string.
	'number'       - (string) If obj is a number.
	'boolean'      - (string) If obj is a boolean.
	'adb.database' - (string) If obj is an ADb.Database.
	'adb.table'    - (string) If obj is an ADb.Table.
	'adb.column'   - (string) If obj is an ADb.Column.
	'adb.row'      - (string) If obj is an ADb.Row.
	'adb.ref'      - (string) If obj is an ADb.$ref.
	'adb.observer' - (string) If obj is an ADb.$observer.
	false          - (boolean) If the object is not defined or none of the above, or if it's an empty string.
Usage:
- Test for an object's existence:
		if (ADb.$type(obj)) {
			...
		}
- Test for an object's type:
		if (ADb.$type(obj) == 'string') {
			...
		}
*/
ADb.$type = function(obj) {
	var type = false;
	if (arguments.length == 0 || typeof obj == 'undefined' || obj == null) type = false;
	else if (obj instanceof Function) type = 'function';
	else if (obj.nodeName) {
		if (obj.nodeType == 3 && !/\S/.test(obj.nodeValue)) type = 'textnode';
		else if (obj.nodeType == 1) type = 'element';
	}
	else if (obj instanceof Date) type = 'date';
	else if (obj instanceof Array) type = 'array';
	else if (obj instanceof RegExp) type = 'regexp';
	else if (obj instanceof ADb.Database) type = 'adb.database';
	else if (obj instanceof ADb.Table) type = 'adb.table';
	else if (obj instanceof ADb.Column) type = 'adb.column';
	else if (obj instanceof ADb.Row) type = 'adb.row';
	else if (obj instanceof ADb.$ref) type = 'adb.ref';
	else if (obj instanceof ADb.$observer) type = 'adb.observer';
	else if (typeof obj == 'object') type = 'object';
	else if (typeof obj == 'string') type = 'string';
	else if (typeof obj == 'boolean') type = 'boolean';
	else if (typeof obj == 'number' && isFinite(obj)) type = 'number';
	return type;
};

/*
Static Method: $validate
	Validates an object as being of the specified type.
Arguments:
	type  - (string) The type to validate against.
	obj   - (object) The object to validate against the type.
Returns:
	true  - (boolean) If the object is of the specified type.
	false - (boolean) If the object isn't of the specified type.
Usage:
- General use.
		if (ADb.$validate('string', obj)) {
			some_arr.push(obj);
		}
*/
ADb.$validate = function(type, obj) {
	type = type == 'auto' ? 'number' : type;
	return (ADb.$type(obj) && type == ADb.$type(obj)) ? true : false;
};

/*
Static Factory: ADb.$ext
	Initializes a new extension cache.
Arguments:
	name     - (string) The name of the extension.
	version  - <OPTIONAL> (string/number) The version of the extension.
Public Properties:
	$name    - (string) The name of the extension.
	$version - (string) The version of the extension.
*/
ADb.$ext = function(name, version) {
	ADb.$extensions[name] = {
		$name: name,
		$version: ADb.$export(version) || ''
	};
	return true;
};

/*
Static Factory: ADb.$observer
	Implements an observer pattern, used for event listening.
Returns:
	(adb.observer) - An initialized observer.
Public Methods:
	publish        - Publish data to the subscribers of the observer.
	subscribe      - Subscribe a function to the observer.
	unsubscribe    - Unsubscribe a function from the observer.
Usage:
	var obs = new ADb.$observer();
*/
ADb.$observer = function() {
	/*
	Private Properties:
		_subscribers - Internal storage container for subscribers of the observer.
	*/
	var _subscribers = [];
	
	/*
	Public Method: publish
		Publish data to the subscribers of the observer.
	Arguments:
		data - The data that will be published.
	Usage:
		obs.publish('some type of object');
	*/
	this.publish = function(data) {
		for (var i = 0; i < _subscribers.length; i++)
			_subscribers[i](data);
	};
	
	/*
	Public Method: subscribe
		Subscribe a function to the observer.
	Arguments:
		fn - Function that will be passed data as it is published.
	Usage:
		var fn = function(data) {
			alert(data);
		};
		obs.subscribe(fn);
	*/
	this.subscribe = function(fn) {
		for (var i = 0; i < _subscribers.length; i++) {
			if (_subscribers[i] == fn)
				return;
		}
		_subscribers.push(fn);
	};
	
	/*
	Public Method: unsubscribe
		Unsubscribe a function from the observer.
	Arguments:
		fn - Function that will be unsubscribed.
	Usage:
		var fn = function(data) {
			alert(data);
		};
		obs.subscribe(fn);
		obs.unsubscribe(fn);
	*/
	this.unsubscribe = function(fn) {
		for (var i = 0; i < _subscribers.length; i++) {
			if (_subscribers[i] == fn)
				_subscribers[i].splice(i,1);
		}
	};
	
	// Bind and extend all private/$column methods.
	ADb.$each(['this.publish','this.subscribe','this.unsubscribe'], function(varname) {
		if (ADb.$validate('function', eval('(' + varname + ')')))
			eval(varname + ' = ADb.$xfn(ADb.$bind(' + varname + ', this));');
	}, this);
};

/*
Static Factory: ADb.$ref
	A placeholder data reference used to reference a foreign key before it might be created.
	The referenced value that will be returned is the primary key value of the first matched row.
	This is primarily used when defining tables and their data in bulk.
Arguments:
	table     - (string) Table to reference.
	column    - (string) Column to reference.
	value     - (object) Value to reference. 
Returns:
	(adb.ref) - An initialized reference.
Public Properties:
	table     - (string) The name of the table to reference.
	column    - (string) The name of the column to reference.
	value     - (object) The value to reference.
Usage:
	db.fruits.$add([null, 'apple', new Date('11/17/2006'), 'juicy', new ADb.$ref('colors', 'name', 'red')]);
*/
ADb.$ref = function(table, column, value) {
	this.table = table;
	this.column = column;
	this.value = value;
};

/*
Extended Function Factory rev.3
	Equivalent on $xfn in xfn.js <http://github.com/andykant/extended-function-factory> 
	(c) Andy Kant, MIT-style license.
Static Factory: $xfn
	Converts a function to an extended function.
	Allows preprocessor/postprocessor functions to be added to a function in order to increase its abilities.
Arguments:
	fn          - (function) The function to extend.
Returns:
	(function)  - An extended function object.
Public Methods:
	$xfn.extend - Converts every function property in an object to an extended function.
	<CALL>      - Calls processors before/after calling the original function.
	pre.add     - (function fn, <OPTIONAL> number priority) Add a preprocessor.
	pre.remove  - (function fn) Remove a preprocessor.
	post.add    - (function fn, <OPTIONAL> number priority) Add a postprocessor.
	post.remove - (function fn) Remove a postprocessor.
*/
ADb.$xfn = function(fn) {
	if (typeof fn != 'function') {
		return fn;
	}
	
	// Define functionality.
	var _pre = [];
	var _post = [];
	var _search = function(left, right, priority, proc) {
		if (right < left) {
			return left;
		}
		var index = Math.floor((left + right) / 2);
		if (priority < proc[index][1]) {
			return _search(index + 1, right, priority, proc);
		} else if (priority > proc[index][1]) {
			return _search(left, index - 1, priority, proc);
		} else {
			while (index < proc.length && priority == proc[index][1]) {
				index++;
			};
			return index;
		}
	};
	var _add = function(proc) {
		return function(fn, priority) {
			priority = priority || 0;
			var idx = _search(0, proc.length - 1, priority, proc);
			for (var i = proc.length; i > idx; i--) {
				proc[i] = proc[i-1];
			}
			proc[idx] = [fn, priority];
		};
	};
	var _remove = function(proc) {
		return function(fn) {
			for (var i = 0; i < proc.length; i++) {
				if (proc[i][0] == fn) {
					proc.splice(i,1);
				}
			}
		};
	};
	
	// Return extended function.
	var func = function() {
		for (var i = 0; i < _pre.length; i++) {
			arguments = _pre[i][0].apply(this, arguments);
			if (typeof arguments == 'undefined') return undefined;
		}
		var result = fn.apply(this, arguments);
		for (var i = 0; i < _post.length; i++) {
			result = _post[i][0].call(this, result);
			if (typeof result == 'undefined') return undefined;
		}
		return result;
	};
	func.pre = {
		add: _add(_pre),
		remove: _remove(_pre)
	};
	func.post = {
		add: _add(_post),
		remove: _remove(_post)
	};
	return func;
};
// Extend an entire object.
ADb.$xfn.extend = function(obj) {
	for (var prop in obj) {
		if (typeof obj[prop] == 'function') {
			obj[prop] = ADb.$xfn(obj[prop]);
		}
	}
};
// Set the revision number.
ADb.$xfn.revision = 3;

// Extend all ADb static methods (except for $xfn).
for (var name in ADb) {
	if (typeof ADb[name] == 'function' && name != '$xfn' && name.match(/^\$/))
		ADb[name] = ADb.$xfn(ADb[name]);
}
