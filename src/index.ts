export * from './lib/async';
export * from './lib/vanity';
export * from './lib/number';

import cluster from 'cluster';

// eslint-disable-next-line import/order
import Conf from 'conf';

// Setup CLI
import vorpal from 'vorpal';
const Vorpal = vorpal();
const chalk = Vorpal.chalk;
Vorpal.delimiter(chalk.blue(`vanity-eth2 】`)).show();

import { getVanityWallet } from './lib/vanity';

const workers = [];
/**
 * Setup number of worker processes to share port which will be defined while setting up server
 */
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
    workers[i].on('message', (message) => {
      console.log(message);
    });
  }

  // process is clustered on a core and process id is assigned
  cluster.on('online', (worker) => {
    Vorpal.log(chalk.green(`Worker ${worker.process.pid} is listening`));
  });

  // if any of the worker process dies then start a new one by simply forking another one
  cluster.on('exit', (worker, code, signal) => {
    Vorpal.log(chalk.cyan('Worker ' + worker.process.pid + ' died with code: ' + chalk.red(code) + ', and signal: ' + chalk.green(signal)));
    Vorpal.log(chalk.cyan('Starting a new worker'));
    cluster.fork();
    workers.push(cluster.fork());
    // to receive messages from worker process
    workers[workers.length - 1].on('message', (message) => {
      Vorpal.log(chalk.yellow.italic(`Worker ${process.pid} `) + message);
    });
  });
};

let input, isChecksum, isSuffix;
const runConfig = new Conf({ configName: 'runConfig', cwd: process.cwd() });
/**
 * Setup server either with clustering or without it
 * @param isClusterRequired
 * @constructor
 */
const invokeCLI = (isClusterRequired) => {
  // if it is a master process then call setting up worker process
  if(isClusterRequired && cluster.isMaster) {
    Vorpal
      .command('gen <input> [checksum] [suffix]', 'Generates an Ethereum wallet with public address matching input regex')
      .action((args, cb) => {
        input = String(args.input);
        isChecksum = !!args.checksum;
        isSuffix = !!args.suffix;
        runConfig.set('input.hex', input);
        runConfig.set('input.isChecksum', isChecksum);
        runConfig.set('input.isSuffix', isSuffix);
        cb('Configured');
        setupWorkerProcesses();
      })
  } else {
    input = runConfig.get('input.hex');
    isChecksum = runConfig.get('input.isChecksum');
    isSuffix = runConfig.get('input.isSuffix');

    if (!input || isChecksum == undefined || isSuffix == undefined) {
      throw Error('runConfig is missing');
    }

    Vorpal.log(chalk.yellow.italic(`Worker: ${process.pid}`));
    // TODO: pass args to Workers
    getVanityWallet(input, isChecksum, isSuffix,
      (wallet) =>  Vorpal.ui.redraw(chalk.blue(`vanity-eth2 】`) + ' ' + chalk.bgBlack.cyan.bold('0x' + wallet.address)),
      (wallet) =>  Vorpal.ui.redraw(chalk.blue(`vanity-eth2 】`) + ' ' + chalk.bgBlack.cyan.bold('0x' + wallet.address) + ' --> ' + chalk.bgBlack.cyan.bold('0x' + wallet.privKey)))
  }
};

invokeCLI(true);
