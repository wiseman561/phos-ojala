import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('catalog_lab_tests')
export class LabTestEntity {
  @PrimaryColumn({ length: 64 }) loinc!: string;
  @Column({ length: 64, nullable: true }) internalCode?: string;
  @Column({ length: 256 }) name!: string;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) aliases!: string[];
  @Column({ length: 64, nullable: true }) specimen?: string;
  @Column({ length: 64 }) ucumUnit!: string;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) altUnits!: string[];
  @Column({ type: 'text', nullable: true }) convertJs?: string;
  @Column({ length: 64, nullable: true }) fhirCode?: string;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) panel!: string[];
  @Column({ type: 'varchar', length: 16, nullable: true }) status?: 'active' | 'deprecated';
}


