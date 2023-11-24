var Mongo = require('@classes/mongo');
var mongoose = require('mongoose');
var Model = mongoose.model("Stripe")
var helpers = require('@classes/helpers');


module.exports = class Hugo {

	constructor(owner, site_id, siteName) {
		this.owner = owner;
		this.site_id = site_id;
		this.site_name = siteName;
		this.mainDir = "/"
	}

	createHugoSite(siteName) {

		var path = require('path');
		var appDir = path.dirname(require.main.filename);

		const execa = require('execa');
		var newdir = './public/www/' + this.owner + "/" + this.site_id;
		execa('mkdir', ['-p', newdir]).then(result => {
			//console.log(result.stdout)
			execa('hugo', ['new', 'site', newdir]).then(result => {
				var dir = "/Users/adamarthur/Documents/Software Projects/API/public/www/" + this.owner + "/" + this.site_id + "/themes/simplicity"
				execa('git', ['clone', 'https://github.com/eshlox/simplicity.git', dir]).then(result => 
				{ 
				 	console.log("Result", result.stdout)
				 	// build site

							try {
							  process.chdir('/Users/adamarthur/Documents/Software Projects/API/public/www/5c2130328bc53f3c903831c5/' + this.site_id);
							  console.log('New directory: ' + process.cwd());
							}
							catch (err) {
							  console.log('chdir: ' + err);
							}

							execa('hugo', ['new', 'first_post.md']).then(result => {

							execa('hugo').then(result => {
						 		console.log("Hugo Executed")

						 		execa('hugo', ['-t', 'simplicity']).then(result => {
						 		 })

						 	});

							})

						 	
				 });
			});
		});

	}

	getHugoContent(siteName) {
		var walk    = require('walk');

		var files   = [];

		// Walker options
		var walker  = walk.walk('./public/www/saas_product/content', { followLinks: false });

		walker.on('directory', function(root, stat, next) {
		    // Add this file to the list of files
		    console.log(stat.name);
		    files.push(root + '/' + stat.name);
		    next();
		});

		walker.on('end', function() {
		    console.log(files);
		});
	}

	setHugoTheme(themeName) {

	}

	addFolder(siteName, dir) {

	}

	addPost(siteName) {

	}

	deletePost(siteName, fileName) {

	}

	editPost(siteName, fileName) {

	}
}
