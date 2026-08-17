import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class BuscarEventosDto {
  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @IsString()
  dataInicio?: string;

  @IsOptional()
  @IsString()
  dataFim?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  @Max(2)
  estado?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  precoMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  precoMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
