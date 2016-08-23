'use strict';
var updateNotifier = require('../');

// you have to run this file two times the first time

updateNotifier({
	pkg: {
		name: 'stable-tag',
		version: '0.1.0'
	},
	registry: 'github',
	githubOwner: 'mhkeller',
	githubAuth: {
		type: 'oauth', // For other types of authentication, see https:// github.com/mikedeboer/node-github#authentication
		token: 'XXXX'
	},
	updateCheckInterval: 0
}).notify();
