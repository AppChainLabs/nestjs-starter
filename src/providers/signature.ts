import { Injectable } from '@nestjs/common';
import { sign } from 'tweetnacl';
import * as bs from 'bs58';

import { AuthType } from '../auth/entities/auth.entity';

@Injectable()
export class SignatureService {
  getSigner(authType: AuthType) {
    switch (authType) {
      case AuthType.EVMChain:
        return new EVMSigner();
      case AuthType.Solana:
        return new SolanaSigner();
      default:
        break;
    }
  }
}

interface Signer {
  verify: (
    message: string,
    signedData: string,
    walletAddress: string,
  ) => boolean;
}

class SolanaSigner implements Signer {
  verify(message: string, signedData: string, walletAddress): boolean {
    const encodedMessage = new TextEncoder().encode(message);
    return sign.detached.verify(
      encodedMessage,
      bs.decode(signedData),
      bs.decode(walletAddress),
    );
  }
}

class EVMSigner implements Signer {
  verify(message: string, signedData: string, walletAddress): boolean {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Web3 = require('web3');
    const web3 = new Web3();

    const address = web3.eth.accounts.recover(message, signedData, false);
    return address === walletAddress;
  }
}
