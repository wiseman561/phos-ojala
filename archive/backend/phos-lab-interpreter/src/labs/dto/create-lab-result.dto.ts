import { IsNumber, IsString } from 'class-validator';

export class CreateLabResultDto {
  @IsString() patientId!: string;
  @IsString() loinc!: string;
  @IsString() name!: string;
  @IsNumber() value!: number;
  @IsString() unit!: string;
}


