'use strict';
var spawn = require('child_process').spawn;
var path = require('path');
var format = require('util').format;
var lazyRequire = require('lazy-req')(require);

var configstore = lazyRequire('configstore');
var chalk = lazyRequire('chalk');
var semverDiff = lazyRequire('semver-diff');
var latestVersion = lazyRequire('latest-version');
var latestGithub = lazyRequire('latest-github-tag');
var isNpm = lazyRequire('is-npm');
var boxen = lazyRequire('boxen');
var xdgBasedir = lazyRequire('xdg-basedir');
var ONE_DAY = 1000 * 60 * 60 * 24;

var registryCheckers = {
	npm: function(options) {
		return latestVersion()(options.pkg.name)
	},
	github: function(options) {
		return latestGithub()(options.githubOwner, options.pkg.name, options.githubOptions)
	}
};

function UpdateNotifier(options) {
	this.options = options = options || {};
	options.pkg = options.pkg || {};
	options.githubOptions = options.githubOptions || {};

	// reduce pkg to the essential keys. with fallback to deprecated options
	// TODO: remove deprecated options at some point far into the future
	options.pkg = {
		name: options.pkg.name || options.packageName,
		version: options.pkg.version || options.packageVersion
	};

	if (!options.pkg.name || !options.pkg.version) {
		throw new Error('pkg.name and pkg.version required');
	}
	if (options.registry === 'github' && !options.githubOwner) {
		throw new Error('githubOwner required for type `github`');
	}

	this.registry = options.registry || 'npm';
	this.packageName = options.pkg.name;
	this.installString = options.installString || ('npm i -g' + (this.registry === 'npm' ? ' ' : ' ' + options.githubOwner + '/') + this.packageName);
	this.packageVersion = options.pkg.version;
	this.updateCheckInterval = typeof options.updateCheckInterval === 'number' ? options.updateCheckInterval : ONE_DAY;
	this.hasCallback = typeof options.callback === 'function';
	this.callback = options.callback || function () {};

	if (!this.hasCallback) {
		try {
			var ConfigStore = configstore();
			this.config = new ConfigStore('update-notifier-' + this.packageName, {
				optOut: false,
				// init with the current time so the first check is only
				// after the set interval, so not to bother users right away
				lastUpdateCheck: Date.now()
			});
		} catch (err) {
			// expecting error code EACCES or EPERM
			var msg =
				chalk().yellow(format(' %s update check failed ', options.pkg.name)) +
				format('\n Try running with %s or get access ', chalk().cyan('sudo')) +
				'\n to the local update config store via \n' +
				chalk().cyan(format(' sudo chown -R $USER:$(id -gn $USER) %s ', xdgBasedir().config));

			process.on('exit', function () {
				console.error('\n' + boxen()(msg, {align: 'center'}));
			});
		}
	}
}

UpdateNotifier.prototype.check = function () {
	if (this.hasCallback) {
		this.checkNpm().then(this.callback.bind(this, null)).catch(this.callback);
		return;
	}
	if (
		!this.config ||
		this.config.get('optOut') ||
		'NO_UPDATE_NOTIFIER' in process.env ||
		process.argv.indexOf('--no-update-notifier') !== -1
	) {
		return;
	}

	this.update = this.config.get('update');

	if (this.update) {
		this.config.del('update');
	}

	// Only check for updates on a set interval
	if (Date.now() - this.config.get('lastUpdateCheck') < this.updateCheckInterval) {
		return;
	}

	// Spawn a detached process, passing the options as an environment property
	spawn(process.execPath, [path.join(__dirname, 'check.js'), JSON.stringify(this.options)], {
		detached: true,
		stdio: 'ignore'
	}).unref();
};

UpdateNotifier.prototype.checkRegistry = function (options) {
	return registryCheckers[this.registry](options).then(function (latestVersion) {
		return {
			latest: latestVersion,
			current: this.packageVersion,
			type: semverDiff()(this.packageVersion, latestVersion) || 'latest',
			name: this.packageName
		};
	}.bind(this));
};

UpdateNotifier.prototype.notify = function (opts) {
	if (!process.stdout.isTTY || isNpm() || !this.update) {
		return this;
	}

	opts = opts || {};

	opts.message = opts.message || 'Update available ' + chalk().dim(this.update.current) + chalk().reset(' → ') +
		chalk().green(this.update.latest) + ' \nRun ' + chalk().cyan(this.installString) + ' to update';

	opts.boxenOpts = opts.boxenOpts || {
		padding: 1,
		margin: 1,
		align: 'center',
		borderColor: 'yellow',
		borderStyle: 'round'
	};

	var message = '\n' + boxen()(opts.message, opts.boxenOpts);

	if (opts.defer === false) {
		console.error(message);
	} else {
		process.on('exit', function () {
			console.error(message);
		});

		process.on('SIGINT', function () {
			console.error('\n' + message);
		});
	}

	return this;
};

module.exports = function (options) {
	var updateNotifier = new UpdateNotifier(options);
	updateNotifier.check();
	return updateNotifier;
};

module.exports.UpdateNotifier = UpdateNotifier;
