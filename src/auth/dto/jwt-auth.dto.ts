export class JwtAuthDto {
  uid: string;
  em: string;
  un: string;
  scope: string[];
  verified: boolean;
  enabled: boolean;
}

export class JwtSignedData {
  signedData: JwtAuthDto;
}

export class JwtPayload extends JwtSignedData {
  typ: string;
  azp: string;
  acr: string;
  sid: string;
}
