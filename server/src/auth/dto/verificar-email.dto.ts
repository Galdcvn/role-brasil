import { Transform } from 'class-transformer';
import { IsEmail, IsInt, Max, Min } from 'class-validator';

export class VerificarEmailDto {
  @IsEmail()
  email!: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  @Max(999999)
  codigo!: number;
}
