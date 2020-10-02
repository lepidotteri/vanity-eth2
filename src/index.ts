export * from './lib/async';
export * from './lib/vanity';
export * from './lib/number';

import cluster from 'cluster';

import vorpal from 'vorpal';
const Vorpal = vorpal();
const chalk = Vorpal.chalk;

import { getVanityWallet } from './lib/vanity';

// const workers = [];
/**
 * Setup number of worker processes to share port which will be defined while setting up server
 *
const setupWorkerProcesses = () => {
  // to read number of cores on system
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const numCores = require('os').cpus().length;
  console.log('Master cluster setting up ' + numCores + ' workers');

  // iterate on number of cores need to be utilized by an application
  // current example will utilize all of them
  for(let i = 0; i < numCores; i++) {
    // creating workers and pushing reference in an array
    // these references can be used to receive messages from workers
    workers.push(cluster.fork());

    // to receive messages from worker process
    workers[i].on('message', function(message) {
      console.log(message);
    });
  }

  // process is clustered on a core and process id is assigned
  cluster.on('online', function(worker) {
    console.log('Worker ' + worker.process.pid + ' is listening');
  });

  // if any of the worker process dies then start a new one by simply forking another one
  cluster.on('exit', function(worker, code, signal) {
    console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
    console.log('Starting a new worker');
    cluster.fork();
    workers.push(cluster.fork());
    // to receive messages from worker process
    workers[workers.length-1].on('message', function(message) {
      console.log(message);
    });
  });
};
*/

let input, isChecksum, isSuffix;
/**
 * Setup server either with clustering or without it
 * @param isClusterRequired
 * @constructor
 */
const invokeCLI = (isClusterRequired) => {
  // if it is a master process then call setting up worker process
  if(isClusterRequired && cluster.isMaster) {
    Vorpal
      .delimiter(chalk.blue(`vanity-eth2 】`))
      .show()
      .command('gen <input> [checksum] [suffix]', 'Generates an Ethereum wallet with public address matching input regex')
      .action((args, cb) => {
        input = String(args.input);
        isChecksum = !!args.checksum;
        isSuffix = !!args.suffix;
        // to setup server configurations and share port address for incoming requests
        getVanityWallet(input, isChecksum, isSuffix, (wallet) => {
          Vorpal.ui.redraw(chalk.blue(`vanity-eth2 】`) + ' ' + chalk.bgBlack.cyan.bold('0x' + wallet.address));
        }, (wallet) => {
          Vorpal.ui.redraw(chalk.blue(`vanity-eth2 】`) + ' ' + chalk.bgBlack.cyan.bold('0x' + wallet.address) + ' --> ' + chalk.bgBlack.cyan.bold('0x' + wallet.privKey));
        })
        // TODO: setupWorkerProcesses();
        cb();
      })
  } else {
    // TODO: pass args to Workers
  }
};

invokeCLI(true);
