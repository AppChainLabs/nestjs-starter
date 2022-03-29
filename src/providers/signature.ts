import { Injectable } from '@nestjs/common';
import { sign } from 'tweetnacl';
import bs from 'bs58';
import web3 from 'web3';

import { AuthType, WalletCredential } from '../auth/entities/auth.entity';
import { WalletCredentialAuthDto } from '../auth/dto/wallet-credential-auth.dto';

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
    data: WalletCredentialAuthDto,
    credential: WalletCredential,
  ) => boolean;
}

class SolanaSigner implements Signer {
  verify(data: WalletCredentialAuthDto, credential: WalletCredential): boolean {
    const message = new TextEncoder().encode(data.message);
    return (
      sign.detached.verify(
        message,
        bs.decode(data.signedData),
        bs.decode(data.walletAddress),
      ) && data.walletAddress === credential.walletAddress
    );
  }
}

class EVMSigner implements Signer {
  verify(data: WalletCredentialAuthDto, credential: WalletCredential): boolean {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const address = web3.eth.accounts.recover(
      data.message,
      data.signedData,
      false,
    );
    return (
      address === data.walletAddress &&
      data.walletAddress === credential.walletAddress
    );
  }
}
