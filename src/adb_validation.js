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
