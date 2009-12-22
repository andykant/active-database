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
