#!/usr/bin/env node

var program = require('commander'),
	cf = require('../src/clusterfork'),
	path = require('path'),
	fs = require('fs'),
	pkg = require('../package.json');

var filePath, funcName;
program
	.version(pkg.version)
	.command('clusterfork [options] <file> [function]')
	.description(pkg.description)
	.option('-w, --workers <amount>', 'The amount of workers to run; specify 0 to use as many as possible', parseInt)
	.option('-p, --production', 'Convenience option, This is the same as running `--workers 0`')
	.action(function (o, f, func) {
		filePath = path.resolve(f);
		funcName = func;
	})
	.parse(process.argv);

if (!filePath) {
	console.error('No file to run, exiting');
	process.exit(0);
} else if (!fs.statSync(path).isFile()) {
	console.error('File path `' + filePath + '` is incorrect.');
	process.exit(1);
}

var file = require(filePath);
var forking = funcName ? file[funcName] : file;

if (!forking) {
	console.error('Forking function not defined.');
	process.exit(1);
}

cf(
	forking,
	program.production ? 0 : program.workers
).start();