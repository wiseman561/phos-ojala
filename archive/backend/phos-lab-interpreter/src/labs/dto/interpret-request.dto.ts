import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class LabItemDto {
  @IsString() loinc!: string;
  @IsString() name!: string;
  @IsNumber() value!: number;
  @IsString() unit!: string;
}

export class InterpretRequestDto {
  @IsString() patientId!: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => LabItemDto) items!: LabItemDto[];
  @IsOptional() @IsString() correlationId?: string;
}


