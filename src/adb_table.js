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
