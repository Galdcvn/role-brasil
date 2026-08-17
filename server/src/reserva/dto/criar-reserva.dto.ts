import { IsArray, IsInt, IsEnum, ValidateNested, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { CategoriaIngresso } from '@prisma/client';

class ItemReservaDto {
  @IsInt()
  assentoSessaoId!: number;

  @IsEnum(CategoriaIngresso)
  categoria!: CategoriaIngresso;
}

export class CriarReservaDto {
  @IsInt()
  sessaoId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemReservaDto)
  @Max(10)
  itens!: ItemReservaDto[];
}
