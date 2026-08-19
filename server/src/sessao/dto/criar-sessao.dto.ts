import { IsDateString, IsInt, Max, Min } from 'class-validator';

export class CriarSessaoDto {
  @IsDateString()
  dataHora!: string;

  @IsInt()
  @Min(1)
  @Max(26)
  fileiras!: number;

  @IsInt()
  @Min(1)
  @Max(100)
  assentosPorFileira!: number;
}
