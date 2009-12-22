[Active Database](http://github.com/andykant/active-database) (ADb)
=================

About
-----
ADb is a relational database system implemented in JavaScript. ADb's implementation is based on the ActiveRecord design pattern.

Information
-----------
* Copyright:  Copyright (c) 2006-2009 Andy Kant, [http://andykant.com/](http://andykant.com/)
* Website:    [http://github.com/andykant/active-database](http://github.com/andykant/active-database)
* License:    MIT-style license
* Version:    1.0.0.20

Credits
-------
* ADb.$type is based on $type from mootools.js, [http://mootools.net](http://mootools.net) (c) Valerio Proietti, MIT-style license.
* ADb.$xfn is equivalent to $xfn from xfn.js, [http://github.com/andykant/extended-function-factory](http://github.com/andykant/extended-function-factory) (c) Andy Kant, MIT-style license.

Notes
-----
* ADb is not a transactional database system. This is primarily because there 
  isn't a reasonable way to clone objects while maintaining their original 
  context. Due to this, assume that changes made to a row have the potential 
  be applied to the database immediately. However, always call the $save 
  method on the row to ensure that the database is updated.
* ADb is a relational database system, but the relations are not enforced.
* It is not recommended to export tables with functions, textnodes, or 
  elements because those objects cannot be exported. Likewise, any objects 
  containing any of these datatypes will probably not export properly 
  either. These datatypes will be exported as 'null' instead with the 
  exception of functions used as default value generators.
* Primary keys are limited to a single column with one of the following 
  datatypes: number, string, auto (auto-incremented number).
* Foreign key references in a table declaration should create a ADb.$ref 
  object if the foreign key's table has not been initialized yet. ADb.$ref will 
  ensure that the table has been initialized, and will then return the first 
  matching entry.
* Columns of the datatype 'auto' should be passed 'null' when creating 
  new rows.
* Any method or property marked as DESTRUCTIVE might cause unintentional 
  results. Destructive methods might change the structure or data of a 
  database or table. Changing the value for a destructive property might 
  prevent the database from working correctly.
* Error messages are only enabled when ADb.$debug is set to 'true'. Error 
  messages will be passed to Firebug if it is available.
* 
