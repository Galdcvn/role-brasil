import { IsEmail, IsNumber, IsString, MinLength } from 'class-validator';

export class RedefinirSenhaDto {
  @IsEmail()
  email: string;

  @IsNumber()
  codigo: number;

  @IsString()
  @MinLength(6)
  novaSenha: string;
}
