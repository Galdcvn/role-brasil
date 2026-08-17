import { IsString, MaxLength, MinLength } from 'class-validator';

export class ValidarIngressoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  codigo!: string;
}
