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
