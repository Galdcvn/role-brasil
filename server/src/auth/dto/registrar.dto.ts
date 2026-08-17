import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegistrarDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  nome!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  senha!: string;

  @IsOptional()
  @IsIn(['CLIENT', 'ORGANIZER', 'PORTARIA'])
  papel?: 'CLIENT' | 'ORGANIZER' | 'PORTARIA';
}
