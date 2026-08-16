import { IsEmail, IsInt, Max, Min } from 'class-validator';

export class VerificarEmailDto {
  @IsEmail()
  email!: string;

  @IsInt()
  @Min(0)
  @Max(999999)
  codigo!: number;
}
