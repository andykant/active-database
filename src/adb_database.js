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
