import { ApiProperty } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({ type: Array, format: 'binary' })
  files: string[];
}
