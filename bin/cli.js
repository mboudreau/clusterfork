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
	process.exit(1);
}

var forking = [filePath];

if (funcName) {
	forking.push(funcName);
}

cf(
	forking,
	program.production ? 0 : program.workers
).start();