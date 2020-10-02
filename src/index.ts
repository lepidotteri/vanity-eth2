export * from './lib/async';
export * from './lib/vanity';
export * from './lib/number';

import vorpal from 'vorpal';
const Vorpal = vorpal();
const chalk = Vorpal.chalk;

import { getVanityWallet } from './lib/vanity';


Vorpal
  .delimiter(chalk.cyan(`vanity-eth2 】`))
  .show()
  .command('gen <input> [checksum] [suffix]', 'Generates an Ethereum wallet with public address matching input regex')
  .action((args, cb) => {
    const input = String(args.input);
    const isChecksum = !!args.checksum;
    const isSuffix = !!args.suffix;
    // console.log(input, isChecksum, isSuffix);
    getVanityWallet(input, isChecksum, isSuffix, (wallet) => {
      Vorpal.ui.redraw(chalk.cyan(`vanity-eth2 】`) + ' ' + chalk.white.bold('0x' + wallet.address));
    }, cb)
  })

