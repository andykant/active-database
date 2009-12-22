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


/*
Class: ADb.Database
	ActiveRecord-based JavaScript database system.
--------------------------------
Arguments:
	tables         - (object) An object including one or more table declarations, hashed by table name.
Returns:
	(adb.database) - An initialized database.
--------------------------------
Public Methods:
	$create        - Create one or more tables in the database.
	$delete        - <DESTRUCTIVE> Deletes a table from the database.
	$export        - Serializes the database into a string.
	$tables        - Returns a list of table names.
Public Observers:
	$events.create - Event fired upon table creation. Subscribers passed table name.
	$events.delete - Event fired upon table deletion. Subscribers passed table name.
Public Properties:
	<DYNAMIC>      - A public property will provided for each table in the database.
	                 The properties will be named according to the table name (db.fruits for the 'fruits' table).
--------------------------------
Usage:
- Initialize an empty database:
		var db = new ADb.Database();
- Initialize an empty database using the ADb alias (equivalent to calling ADb.Database):
		var db = new ADb();
- Initialize database with one or more tables:
		var db = new ADb({
			'colors': {
				'columns': [
					{'name': 'id', 'type': 'auto', 'pk': true},
					{'name': 'name', 'type': 'string', 'generator': function(){return 'n/a';} }
				],
				'rows': [
					{'name': 'red'},
					[null, 'orange'],
					[null, 'yellow']
				]
			},
			'fruits': {
				'columns': [
					{'name': 'name', 'type': 'string', 'pk': true},
					{'name': 'created', 'type': 'date'},
					{'name': 'description', 'type': 'string', generator: function(){return 'nothing!';} },
					{'name': 'color', 'fk': 'colors'}
				],
				'rows': [
					['apple', new Date('11/13/2006'), 'juicy', new ADb.$ref('colors', 'name', 'red')],
					['orange', new Date('11/14/2006'), 'sour', new ADb.$ref('colors', 'name', 'orange')],
					['pear', new Date('11/15/2006'), 'moist', new ADb.$ref('colors', 'name', 'yellow')],
					['strawberry', new Date('11/15/2006'), 'sweet', new ADb.$ref('colors', 'name', 'red')]
				]
			}
		});
*/
ADb.Database = ADb.$xfn(function(tables) {
	/*
	Event Observers:
		$events - Event observer container.
		create  - Event fired upon table creation. Subscribers passed table name.
		delete  - Event fired upon table deletion. Subscribers passed table name.
	Usage:
		db.$events['delete'].subscribe(function(name) {
			alert(name + ' was deleted.');
		});
	*/
	this.$events = {
		'create': new ADb.$observer(),
		'delete': new ADb.$observer()
	};
	
	// Initialization.
	if (tables || false) {
		for (var name in tables)
			this.$create(name, tables[name]);
	}
});

// Extend ADb.Database.
ADb.$extend(ADb.Database.prototype, {
	/*
	Public Method: $create
		Creates a table in the database.
	Arguments:
		name  - (string) The name of the table.
		table - (object) The table declaration.
	Returns:
		true  - If successful.
		false - If unsuccessful.
	Usage:
		db.$create('colors', {
			'columns': [
				{'name': 'id', 'type': 'auto', 'pk': true},
				{'name': 'name', 'type': 'string', 'generator': function(){return 'n/a';} }
			],
			'rows': [
				{'name': 'red'},
				[null, 'orange'],
				[null, 'yellow']
			]
		});
	*/
	$create: function(name, table) {
		var tbl = new ADb.Table(name, table, this);
		if (ADb.$validate('adb.table', tbl) && tbl.$name && name == tbl.$name) {
			this[name] = tbl;
			this.$events['create'].publish(name);
			return true;
		} else {
			return false;
		}
	},

	/*
	Public Method: $delete <DESTRUCTIVE>
		Deletes a table from the database.
	Arguments:
		name - (string) The name of the table to delete.
	Usage:
		db.$delete('fruits');
	*/
	$delete: function(name) {
		var table = this[name];
		delete this[name];
		this.$events['delete'].publish(name);
	},

	/*
	Public Method: $export
		Serializes the database into a string.
	Arguments:
		force    - <OPTIONAL> (boolean) Forces the object to serialize via the 'toString' object method.
	Returns:
		(string) - A string defined as it would be evaluated to a JavaScript object.
							 This happens to be the same as a database declaration.
	Usage:
		var db_string = db.$export();
	*/
	$export: function(force) {
		// Generate the output string.
		force = force || false;
		var output = [];
		output.push('{');
		// Append each serialized table.
		ADb.$each(this.$tables(), function(name, i) {
			if (i) output.push(',');
			output.push("'" + name + "':" + this[name].$export(force));
		}, this);
		output.push('}');
		return output.join('');
	},
	
	/*
	Public Method: $tables
		Returns a list of table names.
	Returns:
		(array[string]) - An array of table names.
	Usage:
		ADb.$each(db.$tables(), function(name) {
			db.$delete(name);
		});
	*/
	$tables: function() {
		var names = [];
		for (var name in this) {
			if (!name.match(/^\$/))
				names.push(name);
		}
		return names;
	}
}, true);


/*
Class: Database.Table <INTERNAL>
	Specifies an ADb.Database table.
--------------------------------
Arguments:
	name            - (string) The name for the table.
	table           - (object) The table declaration.
	database        - (object) The database that owns the table.
Returns:
	(adb.table)     - An initialized table.
--------------------------------
Public Methods:
	<DYNAMIC>       - Find methods will be provided for each column in the table.
	                  The methods will be named according to the column name ('find_by_name' for the 'name' column).
	find            - (adb.row) Returns corresponding row for the primary key.
	find_all        - (array[adb.row]) Returns all rows.
	find_by_...     - (adb.row/array[adb.row]) Returns matching row(s).
	$add            - Adds one or more rows to the table.
	$columns.find   - Finds a column based on a name.
	$columns.fk     - Checks whether a column is a foreign key.
	$columns.pk     - Checks whether a column is a primary key.
	$export         - Serializes the table into a string.
	$expose         - <DESTRUCTIVE> Exposes private objects.
	$new            - Creates a new row object according to the table's column definitions.
Public Observers:
	$events.create  - Event fired upon row creation. Subscribers passed ADb.Row.
	$events.delete  - Event fired upon row deletion. Subscribers passed ADb.Row.
	$events.save    - Event fired upon row save. Subscribers passed ADb.Row.
Public Properties:
	$columns        - An array of all column definitions.
	$database       - Reference to the database object.
	$fk             - A hashtable of columns and the foreign key tables that they are linked to.
	$name           - The name of the table.
	$pk             - The name of the primary key column (if there is one).
--------------------------------
Usage:
	var table = new ADb.Database.Table('colors', {
		'columns': [
			{'name': 'id', 'type': 'auto', 'pk': true},
			{'name': 'name', 'type': 'string', 'generator': function(){return 'n/a';} }
		],
		'rows': [
			{'name': 'red'},
			[null, 'orange'],
			[null, 'yellow']
		]
	}, db);
*/
ADb.Table = ADb.$xfn(function(name, table, database) {
	/*
	Private Properties:
		__      - An array containing a list of private variables.
		_auto   - A hashtable containing the current index for auto-incremented columns.
		_index  - A hashtable containing the array indices of every row hashed by primary key.
		_rows   - An object containing all data in the table.
	*/
	var __ = ['_auto','_index','_rows','_addRow','_deleteRow','_findAll',
	          '_findBy','_findByPK','_rowExists','_saveRow'];
	var _auto = {};
	var _index = {};
	var _rows = [];
	
	/*
	Public Properties:
		$columns  - An array of all column definitions.
		$database - Reference to the database object.
		$fk       - A hashtable of columns and the foreign key tables that they are linked to.
		$name     - The name of the table.
		$pk       - The name of the primary key column (if there is one).
	*/
	this.$columns = [];
	this.$database = database || false;
	this.$fk = {};
	this.$name = name || '';
	this.$pk = false;
	
	/*
	Event Observers:
		$events - Event observer container.
		create  - Event fired upon row creation. Subscribers passed ADb.Row.
		delete  - Event fired upon row deletion. Subscribers passed ADb.Row.
		save    - Event fired upon row save. Subscribers passed ADb.Row.
	Usage:
		db.colors.$events['delete'].subscribe(function(row) {
			alert(row.name + ' was deleted from colors.');
		});
	*/
	this.$events = {
		'create': new ADb.$observer(),
		'delete': new ADb.$observer(),
		'save': new ADb.$observer()
	};
	
	/*
	Private Methods:
		_addRow    - (adb.row) Adds a row to the table and returns an object containing it.
		_deleteRow - (boolean) Deletes the row and returns whether it was successful.
		_findAll   - (array[adb.row]) A skeleton for public 'find_all' methods that returns all rows.
		_findBy    - (array[adb.row]/adb.row/false) A skeleton for public 'find_by' methods that returns all 
		             matches on a specific column.
		_findByPK  - (adb.row) A skeleton for a public 'find' method that returns a row matching a primary key.
		_rowExists - (boolean) Checks if a row exists with the specified index.
		_saveRow   - (boolean) Saves the row and returns true when it finishes. 
	*/
	var _addRow = function(row) {
		// Create nulls for missing columns.
		ADb.$each(this.$columns, function(col) {
			if (!ADb.$type(row[col.name]))
				row[col.name] = null;
		}, this);
		// Generate values where applicable.
		for (var col in row) {
			var column = this.$columns.find(col);
			if (!ADb.$type(row[col])) {
				// Generate default value.
				if (column.type == 'auto') {
					++_auto[col];
					if (this.$columns.pk(col)) {
						while(ADb.$type(_index[_auto[col]]))
							++_auto[col];
					}
					row[col] = _auto[col];
				}
				else
					row[col] = column.generator();
			} else if (ADb.$validate('adb.ref', row[col])) {
				// Grab the referenced value.
				row[col] = this.$database[row[col].table]['find_by_' + row[col].column](row[col].value, 1)[this.$database[row[col].table].$pk];
			}
		}
		// Finish up.
		var index = _rows.push(row) - 1;
		if (this.$pk)
			_index[_rows[index][this.$pk]] = index;
		else
			_index[index] = index;
		// Return the resulting ADb.Row.
		var datarow = new ADb.Row(_rows[index], this, index);
		this.$events['create'].publish(datarow);
		return datarow;
	};
	var _deleteRow = function(index) {
		// Make sure it exists.
		if (_rowExists(index)) {
			// Delete the row.
			var datarow = new ADb.Row(_rows[index], this, -1);
			if (this.$pk)
				delete _index[_rows[index][this.$pk]];
			delete _rows[index];
			this.$events['delete'].publish(datarow);
			return true;
		} else {
			return false;
		}
	};
	var _findAll = function() {
		var matches = [];
		ADb.$each(_rows, function(row, index) {
			if (row)
				matches.push(new ADb.Row(row, this, index));
		}, this);
		return matches;
	};
	var _findBy = function(column, data, limit) {
		var matches = [];
		limit = limit || 0;
		var match = ADb.$each(_rows, function(row, index) {
			if (row && row[column] == data) {
				if (limit == 1)
					return new ADb.Row(row, this, index);
				else
					matches.push(new ADb.Row(row, this, index));
				if (matches.length >= limit)
					return;
			}
		}, this);
		if (limit == 1) {
			if (ADb.$validate('adb.row', match))
				return match;
			else
				return false;
		} else {
			return matches;
		}
	};
	var _findByPK = function(data) {
		return new ADb.Row(_rows[_index[data]], this, _index[data]);
	};
	var _rowExists = function(index) {
		return ADb.$type(_rows[index]);
	};
	var _saveRow = function(index, data) {
		if (_rowExists(index)) {
			// Update existing row.
			ADb.$each(this.$columns, function(col) {
				_rows[index][col.name] = data[col.name];
			}, this);
			// Update primary key.
			if (this.$pk) {
				if (!_index[data[this.$pk]]) {
					ADb.$each(_index, function(idx, pk) {
						if (idx == index)
							delete _index[pk];
					}, this);
					_index[data[this.$pk]] = index;
				}
			}
			var datarow = new ADb.Row(_rows[index], this, index);
			this.$events['save'].publish(datarow);
			return datarow;
		} else {
			// Add new row.
			var datarow = _addRow(data);
			this.$events['save'].publish(datarow);
			return datarow;
		}
	};
	
	/*
	Public Method: $columns.find
		Finds a column based on a name.
	Arguments:
		name         - (string) The name of the column to find.
	Returns:
		(adb.column) - Returns the column definition matching the name.
	Usage:
		var name_column = db.colors.$columns.find('name');
	*/
	this.$columns.find = function(name) {
		for (var i = 0; i < this.$columns.length; i++) {
			if (this.$columns[i].name == name)
				return this.$columns[i];
		}
		return false;
	};
	
		/*
	Public Method: $columns.fk
		Checks whether a column is a foreign key.
	Arguments:
		col   - (adb.column/string) The column or column name to check for a foreign key.
	Returns:
		true  - (boolean) If the column is a foreign key.
		false - (boolean) If the column is not a foreign key.
	Usage:
		if (db.fruits.$columns.fk('name')) {
			...
		}
	*/
	this.$columns.fk = function(col) {
		if (ADb.$validate('adb.column', col))
			col = col.name;
		return this.$fk[col] ? true : false;
	};
	
	/*
	Public Method: $columns.pk
		Checks whether a column is a primary key.
	Arguments:
		col   - (adb.column/string) The column or column name to check for a primary key.
	Returns:
		true  - (boolean) If the column is a primary key.
		false - (boolean) If the column is not a primary key.
	Usage:
		if (db.fruits.$columns.pk('name')) {
			...
		}
	*/
	this.$columns.pk = function(col) {
		if (ADb.$validate('adb.column', col))
			col = col.name;
		return this.$pk == col ? true : false;
	};
	
	/*
	Public Method: $expose <DESTRUCTIVE>
		Exposes private objects.
		This is used for extending functionality outside of an instance.
		Altering private objects may cause unintended effects.
	Arguments:
		ref      - (string) The name of the private object to reference.
	Returns:
		(object) - The object that was referenced.
		(null)   - If the referenced object does not exist.
	Usage:
		var rows = db.table.$expose('_rows');
	*/
	this.$expose = ADb.$bind(function(ref) {
		var obj = null;
		try {
			obj = eval('(' + ref + ')');
		} catch (e) {
			obj = null;
		}
		return obj;
	}, this);
	
	// Bind and extend all private/$column methods.
	ADb.$each(__.concat(['this.$columns.find','this.$columns.fk','this.$columns.pk','this.$expose']), function(varname) {
		if (ADb.$validate('function', eval('(' + varname + ')')))
			eval(varname + ' = ADb.$xfn(ADb.$bind(' + varname + ', this));');
	}, this);
	
	// Initialize.
	if (table || false) {
		// Reset the table.
		_auto = {};
		_index = {};
		_rows = [];
		this.$fk = {};
		this.$pk = false;
		while (this.$columns.length > 0)
			this.$columns.pop();
		// Initialize columns.
		ADb.$each(table.columns, function(col) {
			if (col.fk) {
				col.type = this.$database[col.fk].$columns.find(this.$database[col.fk].$pk).type;
				if (col.type == 'auto')
					col.type = 'number';
			}
			this.$columns.push(new ADb.Column(col.name, col.type || '', col.generator || null));
			if (col.pk)
				this.$pk = col.name;
			if (col.fk)
				this.$fk[col.name] = col.fk;
			if (col.type == 'auto')
				_auto[col.name] = 0;
		}, this);
		// Add 'find_by' methods.
		ADb.$each(this.$columns, function(col) {
			this['find_all'] = function() { return _findAll(); };
			this['find_by_' + col.name] = function(data, limit) { return _findBy(col.name, data, limit); };
			if (this.$pk)
				this['find'] = function(data) { return _findByPK(data); };
		}, this);
		// Initialize rows.
		if (table.rows)
			this.$add.apply(this, table.rows);
	}
});

// Extend ADb.Table.
ADb.$extend(ADb.Table.prototype, {
	/*
	Public Method: $add
		Adds one or more rows to the table.
	Arguments:
		row              - (array/object) 1..n arguments, each specifying a row.
	Returns:
		(array[adb.row]) - If more than one row was added.
		(adb.row)        - If one row was added successfully.
		false            - (boolean) If one row was attempted, but failed to be added.
	Usage:
	- Add one row.
			var color_green = db.colors.$add([null, 'green']);
			var color_brown = db.colors.$add({'color': 'brown'});
	- Add multiple rows.
			var new_colors = db.colors.$add([null, 'green'], {'color': 'brown'});
	*/
	$add: function() {
		/* INIT */ eval(ADb.$init(this.$expose('__')));
		// Each argument is a row to add.
		var result = [];
		ADb.$each(ADb.$array(arguments), function(row) {
			// Convert arrays to objects.
			if (ADb.$validate('array', row)) {
				var old = row;
				row = {};
				ADb.$each(this.$columns, function(col, i) {
					row[col.name] = old[i];
				}, this);
			}
			// Add the row.
			result.push(_addRow(row));
		}, this);
		if (arguments.length > 1)
			return result;
		else if (arguments.length > 0 && results.length > 0)
			return result[0];
		else
			return false;
	},
	
	/*
	Public Method: $export
		Serializes the table into a string.
	Arguments:
		force    - <OPTIONAL> (boolean) Forces the object to serialize via the 'toString' object method.
	Returns:
		(string) - A string defined as it would be evaluated to a JavaScript object.
		           This happens to be the same as a table declaration.
	Usage:
		var table_string = db.table.$export();
	*/
	$export: function(force) {
		/* INIT */ eval(ADb.$init(this.$expose('__')));
		force = force || false;
		var output = [];
		// Serialize the columns.
		output.push("{'columns':[");
		ADb.$each(this.$columns, function(col, i) {
			if (i) output.push(',');
			output.push("{'name':'" + col.name + "'");
			if (this.$columns.pk(col.name))
				output.push(",'pk':true");
			if (this.$columns.fk(col.name)) {
				output.push(",'fk':'" + this.$fk[col.name] + "'");
			} else {
				output.push(",'type':'" + col.type + "'");
				var gen = ADb.$export(col.generator, true);
				if (ADb.$export(ADb.$generator(col.type), true) != gen)
					output.push(",'generator':" + gen);
			}
			output.push('}');
		}, this);
		// Serialize the rows.
		output.push("],'rows':[");
		var hasRows = false;
		ADb.$each(_rows, function(row, i) {
			if (row) {
				if (i && hasRows) output.push(',');
				else hasRows = true;
				output.push('[');
				ADb.$each(this.$columns, function(col, j) {
					if (j) output.push(',');
					output.push(ADb.$export(row[col.name], force));
				}, this);
				output.push(']');
			}
		}, this);
		output.push(']}');
		return output.join('');
	},
	
	/*
	Public Method: $new
		Creates a new row object according to the table's definition.
	Returns:
		(adb.row) - An empty row object.
	Usage:
		var new_row = db.colors.$new();
		new_row.name = 'purple';
		new_row.$save();
	*/
	$new: function() {
		/* INIT */ eval(ADb.$init(this.$expose('__')));
		var row = {};
		ADb.$each(this.$columns, function(col) {
			row[col.name] = col.generator();
		}, this);
		return new ADb.Row(row, this, -1);
	}
}, true);


/*
Class: ADb.Column <INTERNAL>
	Specifies an ADb.Table column.
--------------------------------
Arguments:
	name         - (string) The name for the column.
	type         - (string) The datatype for the column.
	generator    - <OPTIONAL> (function) A custom default value generator for the column.
Returns:
	(adb.column) - An initialized column definition.
--------------------------------
Public Properties:
	generator    - The default value generator of the column.
	name         - The name of the column.
	type         - The datatype of the column.
--------------------------------
Usage:
- Create a column (without default generator):
		var col = new ADb.Column('name', 'string');;
- Create a column (with default generator):
		var col = new ADb.Column('amount', 'number', function(){return 0.0;});
*/
ADb.Column = ADb.$xfn(function(name, type, generator) {
	this.name = name;
	this.type = type;
	this.generator = generator || ADb.$generator(this.type);
});


/*
Class: ADb.Row <INTERNAL>
	Extends the functionality of normal ADb.Table row data.
--------------------------------
Arguments:
	row        - (object) The row data object.
	table      - (adb.table) The table that row belongs to.
	index      - (number) The index of the original row in the table.
Returns:
	(adb.row)  - An initialized row extender.
--------------------------------
Public Methods:
	$delete    - Deletes the row from its table.
	$save      - Saves the changes made to the row to its table.
	$to_array  - Converts the row data to an array.
	$to_object - Converts the row data to an object.
Public Properties:
	<DYNAMIC>  - Properties will be provided for each column in the table.
	             The variable will be named according to the column name (row.name for the 'name' column).
	$table     - Reference to the table object.
--------------------------------
Usage:
	var row = new ADb.Row(row_data, db.colors, -1);
*/
ADb.Row = ADb.$xfn(function(row, table, index) {
	/*
	Private Properties:
		__     - An array containing a list of private variables.
		_index - The index in the table that holds the original row.
	*/
	var __ = ['_index','_init','_updateIndex'];
	var _index = ADb.$validate('number', index) ? index : -1;
	
	/*
	Public Properties:
		$table - Reference to the table object.
	*/
	this.$table = table || false;
	
	/*
	Private Methods:
		_init        - Initializes the row data.
		_updateIndex - Updates the internal row index.
	*/
	var _init = function(row) {
		ADb.$each(row, function(val, col) {
			this[col] = val;
		}, this);
	};
	var _updateIndex = function(index) {
		_index = index;
	};
	
	/*
	Public Method: $expose <DESTRUCTIVE>
		Exposes private objects.
		This is used for extending functionality outside of an instance.
		Altering private objects may cause unintended effects.
	Arguments:
		ref      - (string) The name of the private object to reference.
	Returns:
		(object) - The object that was referenced.
		(null)   - If the referenced object does not exist.
	Usage:
		var index = db.table.$expose('_index');
	*/
	this.$expose = ADb.$bind(function(ref) {
		var obj = null;
		try {
			obj = eval('(' + ref + ')');
		} catch (e) {
			obj = null;
		}
		return obj;
	}, this);
	
	// Bind and extend all private methods.
	ADb.$each(__.concat(['this.$expose']), function(varname) {
		if (ADb.$validate('function', eval('(' + varname + ')')))
			eval(varname + ' = ADb.$xfn(ADb.$bind(' + varname + ', this));');
	}, this);
	
	// Initialize.
	if (row || {})
		_init(row);
});

// Extend ADb.Row.
ADb.$extend(ADb.Row.prototype, {
	/*
	Public Method: $delete
		Delete the row from its table.
	Usage:
		row.$delete();
	*/
	$delete: function() {
		/* INIT */ eval(ADb.$init(this.$expose('__')));
		if (this.$table.$expose('_deleteRow')(_index)) {
			_index = -1;
			_updateIndex(_index);
			return true;
		} else {
			return false;
		}
	},
	
	/*
	Public Method: $save
		Saves the changes made to the row to its table.
	Usage:
		row.$save();
	*/
	$save: function() {
		/* INIT */ eval(ADb.$init(this.$expose('__')));
		var datarow = this.$table.$expose('_saveRow')(_index, this.$to_object());
		_updateIndex(datarow.$expose('_index'));
		_init(datarow.$to_object());
		return true;
	},
	
	/*
	Public Method: $to_array
		Converts the row data to an array.
	Usage:
		var arr = row.$to_array();
	*/
	$to_array: function() {
		var arr = [];
		ADb.$each(this.$table.$columns, function(col) {
			arr.push(this[col.name]);
		}, this);
		return arr;
	},
	
	/*
	Public Method: $to_object
		Converts the row data to an object.
	Usage:
		var obj = row.$to_object();
	*/
	$to_object: function() {
		var obj = {};
		ADb.$each(this.$table.$columns, function(col) {
			obj[col.name] = this[col.name];
		}, this);
		return obj;
	}
}, true);


/*
Extension: ADb Validation Processors
	Attaches validation processors to ADb object methods.
	Validation errors will call ADb.$error and cease execution.
--------------------------------
Notes:
- Validation is primarily intended to be used during development as a debugging 
  tool. It is recommended to remove the validation extension in production to 
  decrease the filesize (unless the data being used is unverified).
*/

// Define extension cache.
ADb.$ext('validation', ADb.$version);

/* ADb.Base *******************************************************************/
ADb.$array.pre.add(function(arr) {
	if (ADb.$type(arr) && ADb.$validate('number', arr.length)) {
		return arguments;
	} else if (ADb.$type(arr)) {
		ADb.$error("Object is not iterable.");
		return undefined;
	} else {
		ADb.$error("Invalid argument for ADb.$array.");
		return undefined;
	}
});
ADb.$bind.pre.add(function(fn, ctx) {
	if (ADb.$validate('function', fn) && ADb.$type(ctx)) {
		return arguments;
	} else {
		ADb.$error("Invalid arguments for ADb.$bind.");
		return undefined;
	}
});
ADb.$each.pre.add(function(obj, fn, ctx) {
	if (ADb.$type(obj) && ADb.$validate('function', fn)) {
		return arguments;
	} else {
		ADb.$error("Invalid arguments for ADb.$each.");
		return undefined;
	}
});
ADb.$error.pre.add(function(message) {
	if (ADb.$validate('string')) {
		return arguments;
	} else {
		ADb.$error("Invalid argument for ADb.$error.");
		return undefined;
	}
});
ADb.$export.pre.add(function(obj, force) {
	if (ADb.$type(obj) && (ADb.$validate('boolean', force) || !ADb.$type(force))) {
		return arguments;
	} else {
		ADb.$error("Invalid arguments for ADb.$export.");
		return undefined;
	}
});
ADb.$extend.pre.add(function(base, extender, xfn) {
	if (ADb.$type(base) && ADb.$type(extender) && (ADb.$validate('boolean', xfn) || !ADb.$type(xfn))) {
		return arguments;
	} else {
		ADb.$error("Invalid arguments for ADb.$extend.");
		return undefined;
	}
});
ADb.$generator.pre.add(function(type) {
	if (ADb.$validate('string', type)) {
		return arguments;
	} else {
		ADb.$error("Invalid argument for ADb.$generator.");
		return undefined;
	}
});
ADb.$import.pre.add(function(data) {
	if (ADb.$validate('string', data)) {
		try {
			eval('(' + data + ')');
			return arguments;
		} catch (e) {
			ADb.$error("Failed to deserialize object in ADb.$import.");
			return undefined;
		}
	} else {
		ADb.$error("Invalid argument for ADb.$import.");
		return undefined;
	}
});
ADb.$index.pre.add(function(arr, obj) {
	if (ADb.$validate('array', arr) && ADb.$type(obj)) {
		return arguments;
	} else {
		ADb.$error("Invalid arguments for ADb.$index.");
		return undefined;
	}
});
ADb.$init.pre.add(function(vars) {
	if (ADb.$validate('array', vars)) {
		return arguments;
	} else {
		ADb.$error("Invalid argument for ADb.$init.");
		return undefined;
	}
});
ADb.$test.pre.add(function(type, isKey) {
	if (ADb.$validate('string', type) && (ADb.$validate('boolean', isKey) || !ADb.$type(isKey))) {
		return arguments;
	} else {
		ADb.$error("Invalid arguments for ADb.$test.");
		return undefined;
	}
});
ADb.$type.pre.add(function(obj) {
	if (arguments.length >= 1) {
		return arguments;
	} else {
		ADb.$error("Invalid argument for ADb.$type.");
		return undefined;
	}
});
ADb.$validate.pre.add(function(type, obj) {
	if (arguments.length >= 2 && typeof type == 'string') {
		return arguments;
	} else {
		ADb.$error("Invalid arguments for ADb.$validate.");
		return undefined;
	}
});
ADb.$ext.pre.add(function(name, version) {
	if (ADb.$validate('string', name) && name && (ADb.$validate('string', version) 
	|| ADb.$validate('number', version) || !ADb.$type(version))) {
		return arguments;
	} else {
		ADb.$error("Invalid arguments for ADb.$ext.");
		return undefined;
	}
});
ADb.$observer.post.add(function(result) {
	this.publish.pre.add(function(data) {
		if (arguments.length > 0) {
			return arguments;
		} else {
			ADb.$error("Invalid argument for ADb.$observer.publish.");
			return undefined;
		}
	});
	this.subscribe.pre.add(function(fn) {
		if (ADb.$validate('function', fn)) {
			return arguments;
		} else {
			ADb.$error("Invalid argument for ADb.$observer.subscribe.");
			return undefined;
		}
	});
	this.unsubscribe.pre.add(function(fn) {
		if (ADb.$validate('function', fn)) {
			return arguments;
		} else {
			ADb.$error("Invalid argument for ADb.$observer.unsubscribe.");
			return undefined;
		}
	});
	// Maintain result.
	return result;
});
ADb.$ref.pre.add(function(table, column, value) {
	if (ADb.$validate('string', table) && ADb.$validate('string', column) && ADb.$type(value)) {
		return arguments;
	} else {
		ADb.$error("Invalid arguments for ADb.$ref.");
		return undefined;
	}
});

/* ADb.Database ***************************************************************/
ADb.Database.pre.add(function(tables) {
	// Validate argument types.
	if (ADb.$validate('object', tables) || !ADb.$type(tables)) {
		return arguments;
	} else {
		ADb.$error("Invalid tables definition.");
		return undefined;
	}
});
ADb.Database.prototype.$create.pre.add(function(tables) {
	tables = tables || {};
	var hasTables = false;
	// Check for a valid table name.
	for (var name in tables) {
		if (name.match(/^\$/)) {
			ADb.$error("Invalid table name '" + name + "'.");
			delete tables[name];
		} else if (ADb.$type(this[name])) {
			ADb.$error("The table '" + name + "' already exists.");
			delete tables[name];
		} else {
			hasTables = true;
		}
	}
	if (hasTables) {
		return arguments;
	} else {
		ADb.$error("Invalid argument for creation of ADb.Database.");
		return undefined;
	}
});
ADb.Database.prototype.$delete.pre.add(function(name) {
	// Validate argument types.
	if (ADb.$validate('string', name) && ADb.$validate('adb.table', this[name])) {
		return arguments;
	} else {
		ADb.$error("Invalid argument for ADb.Database.$delete.");
		return undefined;
	}
});
ADb.Database.prototype.$export.pre.add(function(force) {
	// Validate argument types.
	if (ADb.$validate('boolean', force) || !ADb.$type(force)) {
		return arguments;
	} else {
		ADb.$error("Invalid argument for ADb.Database.$export.");
		return undefined;
	}
});

/* ADb.Table ******************************************************************/
ADb.$extensions['validation'].validateRow = function(row, table) {
	if (ADb.$validate('array', row)) {
		if (table.$columns.length != row.length)
			return false;
		for (var i = 0; i < table.$columns.length; i++) {
			// Validate datatype and check for a reference or null value.
			if (!ADb.$validate(table.$columns[i].type, row[i]) 
			&& !ADb.$validate('adb.ref', row[i]) && ADb.$type(row[i]))
				return false;
			// Check for existing primary key.
			if (table.$columns[i].name == table.$pk && ADb.$type(table.$expose('_index')[row[i]]))
				return false;
		}
		return true;
	} else if (ADb.$validate('object', row)) {
		for (var i in row) {
			var col = table.$columns.find(i);
			// Validate datatype and check for a reference or null value.
			if (!ADb.$type(col) || (!ADb.$validate(col.type, row[i]) 
			&& !ADb.$validate('adb.ref', row[i]) && ADb.$type(row[i])))
				return false;
			// Check for existing primary key.
			if (col.name == table.$pk && ADb.$type(table.$expose('_index')[row[table.$pk]]))
				return false;
		}
		return true;
	} else {
		return false;
	}
};
ADb.Table.pre.add(function(name, table, database) {
	// Validate argument types.
	if (ADb.$validate('string', name) && name && ADb.$validate('object', table) 
	&& ADb.$validate('adb.database', database)) {
		var err = function(message, result) {
			ADb.$error("Invalid ADb.Table definition for table '" + name + "': " + message);
			return ADb.$type(result) ? result : undefined;
		};
		// Validate column definitions.
		var result = false;
		var foundPK = false;
		if (!table.columns) return err('No columns defined.');
		if (!ADb.$validate('array', table.columns)) return err('Invalid columns definition.');
		result = ADb.$each(table.columns, function(col) {
			// Validate column properties.
			if (!(ADb.$validate('string', col.name) && col.name
			&& ((ADb.$validate('string', col.fk) && col.fk) || !ADb.$type(col.fk))
			&& (col.fk || (ADb.$validate('string', col.type) && col.type))
			&& (ADb.$validate('boolean', col.pk) || !ADb.$type(col.pk))
			&& (ADb.$validate('function', col.generator) || !ADb.$type(col.generator))))
				return err("Invalid column definition for the column '" + col.name + "'.", true);
			if (col.name.match(/^\$/)) return err("Invalid name for the column '" + col.name + "'.", true);
			if (col.pk && foundPK) return err("There can only be one primary key.", true);
			if (col.pk && !ADb.$test(col.type, true)) return err("Invalid type for the column '" + col.name + "'.", true);
			if (!col.fk && !ADb.$test(col.type)) return err("Invalid type for the column '" + col.name + "'.", true);
			if (col.fk && (!database[col.fk] || !database[col.fk].$pk)) return err("Invalid foreign key for the column '" + col.name + "'.", true);
			if (col.pk) foundPK = true;
		}, this);
		// Check for error.
		if (result)
			return undefined;
		// Validate row definitions.
		if (table.rows) {
			if (!ADb.$validate('array', table.rows)) return err('Invalid rows definition.');
			// Define a fake table for validation.
			var fake = { $columns: [], $pk: false, $fk: [] };
			fake.$columns.find = ADb.$bind(function(name) {
				for (var i = 0; i < this.$columns.length; i++) {
					if (this.$columns[i].name == name)
						return this.$columns[i];
				}
				return false;
			}, fake);
			ADb.$each(table.columns, function(col) {
				if (col.fk) {
					col.type = database[col.fk].$columns.find(database[col.fk].$pk).type;
					if (col.type == 'auto')
						col.type = 'number';
				}
				fake.$columns.push(new ADb.Column(col.name, col.type || false, col.generator || null));
				if (col.pk)
					fake.$pk = col;
				if (col.fk)
					fake.$fk[col] = col.fk;
			}, this);
			// Validate rows.
			var addedPK = [];
			result = ADb.$each(table.rows, function(row, i) {
				if (!ADb.$extensions['validation'].validateRow(row, fake)) return err('Invalid row definition for row #' + (i+1) + '.', true);
				if (fake.$pk) {
					// Check for duplicate primary keys.
					var pk = null;
					if (ADb.$validate('array', row))
						pk = row[ADb.$index(fake.$columns, fake.$columns.find(fake.$pk))];
					else if (ADb.$validate('object', row))
						pk = row[fake.$pk];
					if (ADb.$type(pk)) {
						if (ADb.$index(addedPK, pk) > -1) return err('Invalid row definition for row #' + (i+1) + '.', true);
						addedPK.push(pk);
					}
				}
			}, this);
			// Check for error.
			if (result)
				return undefined;
		}
		return arguments;
	} else {
		ADb.$error("Invalid arguments for creation of ADb.Table with name '" + name + "'.");
		return undefined;
	}
});
ADb.Table.post.add(function(result) {
	/* INIT */ eval(ADb.$init(this.$expose('__')));
	// Validate private methods.
	_addRow.pre.add(function(row) {
		if (ADb.$extensions['validation'].validateRow(row, this)) {
			return arguments;
		} else {
			ADb.$error('Invalid argument for ADb.Table._addRow.');
			return undefined;
		}
	});
	_deleteRow.pre.add(function(index) {
		if (ADb.$validate('number', index)) {
			return arguments;
		} else {
			ADb.$error('Invalid argument for ADb.Table._deleteRow.');
			return undefined;
		}
	});
	_rowExists.pre.add(function(index) {
		if (ADb.$validate('number', index)) {
			return arguments;
		} else {
			ADb.$error('Invalid argument for ADb.Table._rowExists.');
			return undefined;
		}
	});
	_saveRow.pre.add(function(index, data) {
		if (ADb.$validate('number', index) && ADb.$validate('object', data)) {
			return arguments;
		} else {
			ADb.$error('Invalid argument for ADb.Table._rowExists.');
			return undefined;
		}
	});
	this.$expose.pre.add(function(ref) {
		if (ADb.$validate('string', ref)) {
			return arguments;
		} else {
			ADb.$error('Invalid argument for ADb.Table.$expose.');
			return undefined;
		}
	});
	// Validate private 'find_by' methods.
	var errFind = function(message, method) {
		ADb.$error(message + ' for ADb.Table._find' + method + '.');
		return undefined;
	};
	_findBy.pre.add(ADb.$bind(function(column, data, limit) {
		if (ADb.$validate('string', column) && ADb.$type(data) 
		&& (ADb.$validate('number', limit) || !ADb.$type(limit))) {
			var col = this.$columns.find(column);
			if (col) {
				if (!ADb.$validate(col.type, data)) return errFind('Datatype does not match column', '_by');
				else return arguments;
			} else {
				return errFind('Invalid column', 'By');
			}
		} else {
			return errFind('Invalid arguments', 'By');
		}
	}, this));
	_findByPK.pre.add(ADb.$bind(function(data) {
		if (this.$pk && ADb.$validate(this.$columns.find(this.$pk).type, data)) {
			if (!ADb.$type(this.$expose('_index')[data]))
				return errFind('Invalid primary key', 'ByPK');
			else
				return arguments;
		} else {
			return errFind('Invalid arguments', 'ByPK');
		}
	}, this));
	// Validate $columns methods.
	this.$columns.find.pre.add(function(name) {
		if (ADb.$validate('string', name)) {
			return arguments;
		} else {
			ADb.$error('Invalid argument for ADb.Table.$columns.find.');
			return undefined;
		}
	});
	this.$columns.fk.pre.add(function(col) {
		if (ADb.$validate('string', col) || ADb.$validate('adb.column', col)) {
			return arguments;
		} else {
			ADb.$error('Invalid argument for ADb.Table.$columns.fk.');
			return undefined;
		}
	});
	this.$columns.pk.pre.add(function(col) {
		if (ADb.$validate('string', col) || ADb.$validate('adb.column', col)) {
			return arguments;
		} else {
			ADb.$error('Invalid argument for ADb.Table.$columns.pk.');
			return undefined;
		}
	});
	// Maintain result.
	return result;
});
ADb.Table.prototype.$add.pre.add(function() {
	var addedPK = [];
	// Validate rows.
	var result = ADb.$each(ADb.$array(arguments), function(row) {
		if (!ADb.$extensions['validation'].validateRow(row, this)) {
			ADb.$error("Invalid row definition for the table '" + this.$name + "'.");
			return true;
		}
		// Check for duplicate primary keys.
		if (this.$pk) {
			var pk = null;
			if (ADb.$validate('array', row))
				pk = row[ADb.$index(this.$columns, this.$columns.find(this.$pk))];
			else if (ADb.$validate('object', row))
				pk = row[this.$pk];
			if (ADb.$type(pk)) {
				if (ADb.$index(addedPK, pk) > -1) {
					ADb.$error("Invalid row definition for the table '" + this.$name + "'.");
					return true;
				}
				addedPK.push(pk);
			}
		}
	}, this);
	if (result)
		return undefined;
	else
		return arguments;
});
ADb.Table.prototype.$export.pre.add(function(force) {
	// Validate argument types.
	if (ADb.$validate('boolean', force) || !ADb.$type(force)) {
		return arguments;
	} else {
		ADb.$error("Invalid argument for ADb.Table.$export.");
		return undefined;
	}
});

/* ADb.Column *****************************************************************/
ADb.Column.pre.add(function(name, type, generator) {
	// Validate argument types.
	if (ADb.$validate('string', name) && ADb.$validate('string', type) && ADb.$test(type)
	&& (ADb.$validate('function', generator) || !ADb.$type(generator))) {
		return arguments;
	} else {
		ADb.$error("Invalid arguments for creation of ADb.Column with name '" + name + "'.");
		return undefined;
	}
});

/* ADb.Row ********************************************************************/
ADb.Row.pre.add(function(row, table, index) {
	// Validate argument types.
	if (ADb.$validate('object', row) && ADb.$validate('adb.table', table)
	&& ADb.$validate('number', index)) {
		return arguments;
	} else {
		ADb.$error("Invalid arguments for creation of ADb.Row.");
		return undefined;
	}
});
ADb.Row.post.add(function(result) {
	/* INIT */ eval(ADb.$init(this.$expose('__')));
	// Validate private methods.
	_init.pre.add(function(row) {
		if (ADb.$extensions['validation'].validateRow(row, this.$table)) {
			return arguments;
		} else {
			ADb.$error('Invalid argument for ADb.Row._init.');
			return undefined;
		}
	});
	_updateIndex.pre.add(function(index) {
		if (ADb.$validate('number', index)) {
			return arguments;
		} else {
			ADb.$error('Invalid argument for ADb.Row._updateIndex.');
			return undefined;
		}
	});
	this.$expose.pre.add(function(ref) {
		if (ADb.$validate('string', ref)) {
			return arguments;
		} else {
			ADb.$error('Invalid argument for ADb.Row.$expose.');
			return undefined;
		}
	});
	// Maintain result.
	return result;
});
