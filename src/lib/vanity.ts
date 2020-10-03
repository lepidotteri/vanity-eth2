import { privateToAddress as privateToAddr } from 'ethereumjs-util'
import keccak from 'keccak';
import randomBytes from 'randombytes';

/**
 * Transform a private key into an address
 */
const privateToAddress = (privateKey) => {
  return privateToAddr(privateKey);
};

/**
 * Create a wallet from a random private key
 * @returns {{address: string, privKey: string}}
 */
const getRandomWallet = () => {
  const randbytes = randomBytes(32);
  return {
    address: privateToAddress(randbytes).toString('hex'),
    privKey: randbytes.toString('hex')
  };
};

/**
 * Check if a wallet respects the input constraints
 * @param address
 * @param input
 * @param isChecksum
 * @param isSuffix
 * @returns {boolean}
 */
const isValidVanityAddress = (address, input, isChecksum, isSuffix) => {
  const subStr = isSuffix ? address.substr(40 - input.length) : address.substr(0, input.length);

  if (!isChecksum) {
    return input === subStr;
  }
  if (input.toLowerCase() !== subStr) {
    return false;
  }

  return isValidChecksum(address, input, isSuffix);
};

const isValidChecksum = (address, input, isSuffix) => {
  const hash = keccak('keccak256').update(address).digest().toString('hex');
  const shift = isSuffix ? 40 - input.length : 0;

  for (let i = 0; i < input.length; i++) {
    const j = i + shift;
    if (input[i] !== (parseInt(hash[j], 16) >= 8 ? address[j].toUpperCase() : address[j])) {
      return false;
    }
  }
  return true;
};

/**
 * Generate a lot of wallets until one satisfies the input constraints
 * @param input - String chosen by the user
 * @param isChecksum - Is the input case-sensitive
 * @param isSuffix - Is it a suffix, or a prefix
 * @param cb - Callback called when the right address is found
 * @returns
 */
export const getVanityWallet = (input: string, isChecksum: boolean, isSuffix: boolean, cb) => {
  input = isChecksum ? input : input.toLowerCase();
  let wallet = getRandomWallet();
  while (!isValidVanityAddress(wallet.address, input, isChecksum, isSuffix)) {
    wallet = getRandomWallet();
  }
  cb(wallet);
};
