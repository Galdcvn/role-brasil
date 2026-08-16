import { CategoriaIngresso } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class CategoriaDto {
  @IsEnum(CategoriaIngresso)
  nome!: CategoriaIngresso;

  @IsInt()
  @Min(0)
  precoCentavos!: number;

  @IsOptional()
  @IsBoolean()
  requerComprovante?: boolean;
}
