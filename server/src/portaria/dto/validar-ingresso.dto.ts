import { IsInt, IsOptional, MaxLength, MinLength } from 'class-validator';

export class ValidarIngressoDto {
  @MinLength(1)
  @MaxLength(255)
  codigo!: string;

  @IsOptional()
  @IsInt()
  eventoId?: number;
}
