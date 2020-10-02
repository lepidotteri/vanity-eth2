export * from './lib/async';
export * from './lib/vanity';
export * from './lib/number';

import vorpal from 'vorpal';

import { getVanityWallet } from './lib/vanity';

vorpal()
  .delimiter(`vanity-eth2 】`)
  .show()
  .command('gen <input> [checksum] [suffix]', 'Generates an Ethereum wallet with public address matching input regex')
  .action((args, cb) => {
    const input = String(args.input);
    const isChecksum = !!args.checksum;
    const isSuffix = !!args.suffix;
    console.log(input, isChecksum, isSuffix);
    getVanityWallet(input, isChecksum, isSuffix, cb)
  })

