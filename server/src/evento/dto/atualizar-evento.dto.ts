import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CategoriaDto } from './categoria.dto';
import { EnderecoDto } from './endereco.dto';

export class AtualizarEventoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  posterUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefoneSuporte?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  emailSuporte?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => EnderecoDto)
  endereco?: EnderecoDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoriaDto)
  categorias?: CategoriaDto[];
}
