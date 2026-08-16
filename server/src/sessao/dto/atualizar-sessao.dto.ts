import { IsDateString } from 'class-validator';

export class AtualizarSessaoDto {
  @IsDateString()
  dataHora!: string;
}
