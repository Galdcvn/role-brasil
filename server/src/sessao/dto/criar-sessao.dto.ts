import { IsDateString } from 'class-validator';

export class CriarSessaoDto {
  @IsDateString()
  dataHora!: string;
}
