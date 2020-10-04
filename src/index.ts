export * from './lib/async';
export * from './lib/vanity';
export * from './lib/number';

import cluster from 'cluster';
import v8 from 'v8';

import os from 'os-utils';
// eslint-disable-next-line import/order
import Conf from 'conf';

// Setup CLI
import vorpal from 'vorpal';
const Vorpal = vorpal();
const chalk = Vorpal.chalk;

import { getVanityWallet } from './lib/vanity';

const workers: number[] = [];
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
    // these references can be used to receive messages from workers (and to remove them)
    workers.push(cluster.fork().id);

    // to receive messages from worker process
    // workers[i].on('message', (message) => {
    //  console.log(message);
    // });
  }

  // process is clustered on a core and process id is assigned
  cluster.on('online', (worker) => {
    Vorpal.log(chalk.green(`Worker ${worker.process.pid} is listening`));
  });

  // if any of the worker process dies then start a new one by simply forking another one
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  cluster.on('exit', (worker, code, signal) => {
    // Vorpal.log(chalk.cyan('Worker ' + worker.process.pid + ' died with code: ' + chalk.red(code) + ', and signal: ' + chalk.green(signal)));
    // Vorpal.log(chalk.cyan('Starting a new worker'));
    const oldWorker = workers.indexOf(worker.id);
    workers.splice(oldWorker, 1);
    const newWorker = cluster.fork();
    workers.push(newWorker.id);
    // to receive messages from worker process
    // workers[workers.length - 1].on('message', (message) => {
    // Vorpal.log(chalk.yellow.italic(`Worker ${process.pid} `) + message);
    // });
  });
};

let input, isChecksum, isSuffix;
const runConfig = new Conf({ configName: 'runConfig', cwd: process.cwd() });
const runResult = new Conf({ configName: 'runResult', cwd: process.cwd() });

const saveAndShutdown = (wallet) => {
  runResult.set('wallet', wallet);
  runResult.set('timestamp', new Date().toISOString())
  Vorpal.log(wallet);
  for (const id in cluster.workers) {
    workers[id].kill();
  }
  if(cluster.isMaster) {
    process.exit(0);
  }
}

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
        runConfig.set('input.hex', input);
        runConfig.set('input.isChecksum', isChecksum);
        runConfig.set('input.isSuffix', isSuffix);
        cb('Configured');
        setupWorkerProcesses();
        // log CPU usage
        // setTimeout(() => {
        //   os.cpuUsage((v) => Vorpal.ui.redraw(chalk.green('CPU Usage: ' + v + '%' )))
        // }, 500);
      })
  } else {

    input = runConfig.get('input.hex');
    isChecksum = runConfig.get('input.isChecksum');
    isSuffix = runConfig.get('input.isSuffix');

    if (!input || isChecksum == undefined || isSuffix == undefined) {
      throw Error('runConfig is missing');
    }

    const initialStats = v8.getHeapStatistics();
    const totalHeapSizeThreshold = initialStats.heap_size_limit * 95 / 100;
    // console.log("totalHeapSizeThreshold: " + totalHeapSizeThreshold);

    const detectHeapOverflow = () => {
      const stats = v8.getHeapStatistics();
      // console.log("total_heap_size: " + (stats.total_heap_size));
      if ((stats.total_heap_size) > totalHeapSizeThreshold) {
        process.exit();
      }
    };

    setInterval(detectHeapOverflow, 1000);
    getVanityWallet(input, isChecksum, isSuffix,(wallet) => saveAndShutdown(wallet))
  }
};

invokeCLI(true);

