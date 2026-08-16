import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CategoriaDto } from './categoria.dto';
import { EnderecoDto } from './endereco.dto';

export class CriarEventoDto {
  @IsOptional()
  @IsInt()
  tmdbId?: number;

  @ValidateIf((dto: CriarEventoDto) => dto.tmdbId === undefined)
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

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CategoriaDto)
  categorias!: CategoriaDto[];
}
