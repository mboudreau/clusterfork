/* global process:true */
'use strict';

var cluster = require('cluster'),
	check = require('check-types');

function ClusterFork(forking, workers) {
	check.assert.not.function(forking, 'Forking function not defined properly.');
	this.forking = forking;
	this.workers = check.undefined(workers) ? 1 : workers || require('os').cpus().length;
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
