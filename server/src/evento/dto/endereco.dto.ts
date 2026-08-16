import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class EnderecoDto {
  @IsString()
  @MinLength(8)
  @MaxLength(9)
  cep!: string;

  @IsString()
  @MaxLength(255)
  rua!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  numero?: number;

  @IsString()
  @MaxLength(255)
  bairro!: string;

  @IsString()
  @MaxLength(255)
  cidade!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2)
  estado!: string;
}
