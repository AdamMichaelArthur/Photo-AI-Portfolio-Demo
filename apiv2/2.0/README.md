What is the "n" directory for?

The 'n' stands for node, and is intended to allow the project to use different technologies
in the future.

So, for example, if a Data Scientist is hired and wants to do backend work in Python, we would
make a 'p' directory and all of the python code would go there.

The filename == lowercase.js
dashes result in a TitleCamelCase lower-case.js == LowerCase
======================

import Base from '../../../classes/Base/base.js'

export default class ClassName extends Base {

	constructor(initializers =null, route ='', className =''){
		super(initializers, route, className);
	}

	test(){
		this.response.reply("works");
	}

}

======================