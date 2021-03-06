# update-notifier-plus [![Build Status](https://travis-ci.org/mhkeller/update-notifier-plus.svg?branch=master)](https://travis-ci.org/mhkeller/update-notifier-plus)

> Update notifications for your CLI app. Supports: GitHub (including private repos) or npm; custom install messages.

![](screenshot.png)

Inform users of your package of updates in a non-intrusive way. 

### How is this different from [update-notifier](https://www.npmjs.com/package/update-notifier)?

This fork adds two features:

1. The ability to use a GitHub repo as your reference point, in which case it will match against the latest tag version. Private repos are also supported as long as you pass authentication (see examples below).
2. The option to specify a different install command while keeping the nice box design to the notify message. You might use this feature if you want to tell users to prepend `sudo` to their install command or add certain environment variables. 

#### Table of Contents

- [Examples](#examples)
- [How](#how)
- [API](#api)
- [About](#about)


## Examples

### Simple example

```js
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');

updateNotifier({pkg}).notify();
```

### Comprehensive example

```js
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');

// Checks for available update and returns an instance
const notifier = updateNotifier({pkg});

// Notify using the built-in convenience method
notifier.notify();

// `notifier.update` contains some useful info about the update
console.log(notifier.update);
/*
{
	latest: '1.0.1',
	current: '1.0.0',
	type: 'patch', // possible values: latest, major, minor, patch, prerelease, build
	name: 'pageres'
}
*/
```

### GitHub tag example 

```js
const updateNotifier = require('update-notifier');
const pkg = {
  pkg: require('./package.json'),
  registry: 'github',
  githubOwner: 'repo-owner'
}

// For private repos, add the following
// pkg.githubAuth = {
//   type: 'oauth', // For other types of authentication, see https:// github.com/mikedeboer/node-github#authentication
//   token: 'XXXXX'
// }

// Checks for available update and returns an instance
const notifier = updateNotifier(pkg);

// Notify using the built-in convenience method
notifier.notify();

// `notifier.update` contains some useful info about the update
console.log(notifier.update);
/*
{
  latest: '1.0.1',
  current: '1.0.0',
  type: 'patch', // possible values: latest, major, minor, patch, prerelease, build
  name: 'pageres'
}
*/
```

### Example with settings and custom message

```js
const notifier = updateNotifier({
  pkg,
  updateCheckInterval: 1000 * 60 * 60 * 24 * 7 // 1 week
});

console.log(`Update available: ${notifier.update.latest}`);
```

### Example with custom install string

```js
const notifier = updateNotifier({
	pkg: pkg,
	installString: 'sudo npm install -g <org>/<repo>'
});

// Prints the normal install box, replacing `npm install <pkg-name>` with your `installString`.
```


## How

Whenever you initiate the update notifier and it's not within the interval threshold, it will asynchronously check with npm in the background for available updates, then persist the result. The next time the notifier is initiated the result will be loaded into the `.update` property. This prevents any impact on your package startup performance.
The check process is done in a unref'ed [child process](http://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options). This means that if you call `process.exit`, the check will still be performed in its own process.


## API

### updateNotifier(options)

Checks if there is an available update. Accepts settings defined below. Returns an object with update info if there is an available update, otherwise `undefined`.

### options

#### pkg

Type: `object`

##### name

*Required*<br>
Type: `string`

##### version

*Required*<br>
Type: `string`

#### updateCheckInterval

Type: `number`<br>
Default: 1000 * 60 * 60 * 24 (1 day)

How often to check for updates.

#### callback(error, update)

Type: `function`<br>

Passing a callback here will make it check for an update directly and report right away. Not recommended as you won't get the benefits explained in [`How`](#how).

`update` is equal to `notifier.update`


### updateNotifier.notify([options])

Convenience method to display a notification message *(see screenshot)*.

Only notifies if there is an update and the process is [TTY](http://nodejs.org/api/tty.html).

#### options.defer

Type: `boolean`<br>
Default: `true`

Defer showing the notification to after the process has exited.

#### options.message

Type: `string`<br>
Default: [See the screen shot above](https://github.com/yeoman/update-notifier#update-notifier-)

The message that will be shown when an update is available.

#### options.boxenOpts

Type: `object`<br>
Default: `{ padding: 1, margin: 1, align: 'center', borderColor: 'yellow', borderStyle: 'round' }` ([See the screen shot above](https://github.com/yeoman/update-notifier#update-notifier-))

The object that will be passed to [boxen](https://github.com/sindresorhus/boxen).

### User settings

Users of your module have the ability to opt-out of the update notifier by changing the `optOut` property to `true` in `~/.config/configstore/update-notifier-[your-module-name].yml`. The path is available in `notifier.config.path`.

Users can also opt-out by [setting the environment variable](https://github.com/sindresorhus/guides/blob/master/set-environment-variables.md) `NO_UPDATE_NOTIFIER` with any value or by using the `--no-update-notifier` flag on a per run basis.


## About

The idea for this module came from the desire to apply the browser update strategy to CLI tools, where everyone is always on the latest version. We first tried automatic updating, which we discovered wasn't popular. This is the second iteration of that idea, but limited to just update notifications.

There are a bunch projects using it:

- [Yeoman](http://yeoman.io) - Modern workflows for modern webapps
- [AVA](https://ava.li) - Simple concurrent test runner
- [XO](https://github.com/sindresorhus/xo) - JavaScript happiness style linter
- [Pageres](https://github.com/sindresorhus/pageres) - Capture website screenshots
- [Node GH](http://nodegh.io) - GitHub command line tool
- [Bower](http://bower.io) - A package manager for the web
- [Hoodie CLI](http://hood.ie) - Hoodie command line tool
- [Roots](http://roots.cx) - A toolkit for advanced front-end development

[And 600+ more...](https://www.npmjs.org/browse/depended/update-notifier)


## License

[BSD license](http://opensource.org/licenses/bsd-license.php) and copyright Google
