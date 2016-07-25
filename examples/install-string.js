'use strict';
var updateNotifier = require('../');

// you have to run this file two times the first time

updateNotifier({
	pkg: {
		name: 'stable-tag',
		version: '0.1.0'
	},
  registry: 'github',
  githubOwner: "mhkeller",
  installString: 'NODE_TLS_REJECT_UNAUTHORIZED=\'0\' sudo -E npm install -g mhkeller/stable-tag',
	updateCheckInterval: 0
}).notify();
