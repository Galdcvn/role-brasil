import { IsString, MaxLength, MinLength } from 'class-validator';

export class BuscarCatalogoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  q!: string;
}
