/* global process:true */
'use strict';

var cluster = require('cluster'),
	check = require('check-types'),
	fs = require('fs'),
	path = require('path'),
	q = require('q'),
	maxCpus = require('os').cpus().length;

function ClusterFork(forking, workers, restart) {
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
	check.assert.greaterOrEqual(workers, 0, 'Worker amount must be a positive number.');
	if (check.greater(workers, maxCpus)) {
		console.warn('Worker amount greater than CPUs available, limiting to maximum CPUs.  Use `0` instead to automatically scale to max CPUs.')
	}

	this.forking = forking;
	this.restart = restart || false;
	this.workers = workers === 0 ? maxCpus : Math.min(workers || 1, maxCpus);
	this._workerCount = 0;
}

ClusterFork.prototype.start = function () {
	var deferred = q.defer(),
		that = this;

	function createWorker() {
		var worker = cluster.fork();

		worker.once('online', function () {
			that._workerCount++;
			console.info('Worker %s started.', worker.id);
		});

		worker.once('disconnect', function () {
			console.info('Worker %s disconnecting.', worker.id);
		});

		// if a worker dies, respawn
		worker.once('exit', function (code) {
			that._workerCount--;
			console.warn('Worker %s died, exited with code %d', worker.id, code);
			// if worker died with an error, try to restart
			if (that.restart && code !== 0) {
				console.info('Restarting dead worker %s', worker.id);
				createWorker();
			} else if (that._workerCount == 0) {
				console.info('No more workers available, killing master process with same exit code as workers.');
				that.stop();
				process.exit(code);
			}
		});

		return worker;
	}

	// If master process, spin up other processes under it
	if (cluster.isMaster) {
		console.info('Starting master, pid %s, spawning %d worker%s', process.pid, that.workers, (that.workers == 1 ? '' : 's'));

		// fork workers
		for (var i = 0, len = that.workers; i < len; i++) {
			createWorker().once('online', function () {
				if (that._workerCount == that.workers) {
					deferred.resolve(that);
				}
			});
		}
	} else {
		this.forking();
	}

	return deferred.promise.timeout(5000, 'Cluster forking timed out.');
};

ClusterFork.prototype.stop = function () {
	var deferred = q.defer(),
		that = this;

	if (cluster && cluster.disconnect) {
		cluster.disconnect(function () {
			deferred.resolve(that);
		});
	} else {
		deferred.resolve(that);
	}

	return deferred.promise.timeout(5000, 'Cluster disconnect timed out.');
};

ClusterFork.prototype.restart = function () {
	return this.stop().then(this.start);
};

module.exports = function (forking, workers, restart) {
	return new ClusterFork(forking, workers, restart)
};
