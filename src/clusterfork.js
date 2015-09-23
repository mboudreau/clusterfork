/* global process:true */
'use strict';

var cluster = require('cluster'),
	check = require('check-types'),
	fs = require('fs'),
	path = require('path'),
	maxCpus = require('os').cpus().length;

function ClusterFork(forking, workers) {
	// check if forking is string, array, or function
	if (check.string(forking)) {
		forking = [forking];
	}
	if (check.array(forking)) {
		var filePath = forking[0];
		check.assert.ok(fs.lstatSync(path.resolve(filePath)).isFile(), 'The path, `' + filePath + '` is not a valid file');
		var req = require(forking);
		forking = forking[1] ? req[forking[1]] : req;
	}
	check.assert.function(forking, 'Forking function not defined properly.');

	// Worker Check
	check.assert.integer(workers, 'Worker amount must be an integer.');
	check.assert.positive(workers, 'Worker amount must be a positive number.');
	if (check.greater(workers, maxCpus)) {
		console.warn('Worker amount greater than CPUs available, limiting to maximum CPUs.  Use `0` instead to automatically scale to max CPUs.')
	}

	this.forking = forking;
	this.workers = workers === 0 ? maxCpus : Math.min(workers || 1, maxCpus);
}

// TODO: use promises
ClusterFork.prototype.start = function () {
	// If master process, spin up other processes under it
	if (cluster.isMaster) {
		console.info('Starting master, pid ' + process.pid + ', spawning ' + this.workers + ' workers');

		// fork workers
		for (var i = 0, len = this.workers; i < len; i++) {
			cluster.fork();
		}

		cluster.on('listening', function (worker) {
			console.info('Worker ' + worker.id + ' started');
		});

		// if a worker dies, respawn
		cluster.on('death', function (worker) {
			console.warn('Worker ' + worker.id + ' died, restarting...');
			cluster.fork();
		});

	} else {
		this.forking();
	}

	return this;
};

ClusterFork.prototype.stop = function () {
	cluster.disconnect();
	return this;
};

ClusterFork.prototype.restart = function () {
	return this;
};

module.exports = function (forking, workers) {
	return new ClusterFork(forking, workers)
};
