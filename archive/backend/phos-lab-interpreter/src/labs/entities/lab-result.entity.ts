import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('lab_results')
export class LabResultEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index() @Column() patientId!: string;
  @Column() loinc!: string;
  @Column() name!: string;
  @Column('float') value!: number;
  @Column() unit!: string;
  @CreateDateColumn() createdAt!: Date;
}


