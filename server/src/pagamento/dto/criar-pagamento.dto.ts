import { IsEnum, IsInt, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CartaoDto {
  nome!: string;
  numero!: string;
  validade!: string;
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
