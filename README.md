# ClusterFork

An extremely simple way to cluster your node process for production purposes


## Install

`npm install clusterfork --save`

## Usage

### Node

If you have an application called `your-app` and a service runs automatically when it is required, then you only need this in your index.js file.

```
var cf = require('clusterfork'),
	app = require('your-app'),
	production = process.env.production || false;

cf(app, production ? 0 : 1, false);
```

The first argument of ClusterFork is the function where it will spin up your server.  Then can be a more complex object, like `app.run`, but it needs to be the forking function of your server.

It can also be a path to a file that needs to be required `cf('./app.js', 1)` and you can specify if there's a particular function under that required file that needs to be ran instead by using an array instead `cf(['./app.js', 'run'], 1)`.
 
The second argument is the amount of workers needed to be spun up.  By default, this defaults to 1 for development purposes.  If 0 is specified, ClusterFork will try to create as many forks as there are CPUs available to it.  If the number of requested workers exceed the number of CPUs, it will simply used the maximum CPU amount.

The third argument to is let ClusterFork know to restart a forked process that has died.  By default, this is false.  This is sometimes useful in production when your app dies violently, but still want it to restart and keep up with the load, but it might keep dying again if it hit the same edge case.

### Command Line

ClusterFork can also be used within a command line.  This is useful if you don't want a direct dependency to ClusterFork within your codebase, or that the codebase isn't "yours".

```
clusterfork -w 4 ./app.js run
```

There are only two options available, `-w` or `--worker` which is the amount of workers or `-p` or `--production` which does the same as `-w 0` which is to say, use the maximum amount of CPUs available.

Then you simply need to specify the file to require, and optionaly, which function to call within said file.