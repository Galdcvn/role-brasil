import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AtualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  nome?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;
}
