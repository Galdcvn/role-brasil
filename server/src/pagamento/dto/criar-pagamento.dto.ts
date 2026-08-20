import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CartaoDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsString()
  @IsNotEmpty()
  numero!: string;

  @IsString()
  @IsNotEmpty()
  validade!: string;

  @IsString()
  @IsNotEmpty()
  cvv!: string;
}

export class CriarPagamentoDto {
  @IsInt()
  reservaId!: number;

  @IsEnum(['PIX', 'CARTAO'] as const)
  tipo!: 'PIX' | 'CARTAO';

  @IsOptional()
  @ValidateNested()
  @Type(() => CartaoDto)
  cartao?: CartaoDto;
}
