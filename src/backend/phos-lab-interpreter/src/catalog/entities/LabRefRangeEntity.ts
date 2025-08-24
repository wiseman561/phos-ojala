import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LabTestEntity } from './LabTestEntity';

@Entity('catalog_lab_ref_ranges')
@Index('IDX_ref_range_loinc_tenant', ['loinc', 'tenantId'])
export class LabRefRangeEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index() @Column({ length: 64 }) loinc!: string;
  @ManyToOne(() => LabTestEntity, { onDelete: 'CASCADE' }) test?: LabTestEntity;

  @Column({ type: 'varchar', length: 8 }) sex!: 'male' | 'female' | 'any';
  @Column({ type: 'float', nullable: true }) ageMin?: number;
  @Column({ type: 'float', nullable: true }) ageMax?: number;
  @Column({ type: 'bool', nullable: true }) pregnant?: boolean | null;

  @Column({ type: 'float', nullable: true }) refLow?: number;
  @Column({ type: 'float', nullable: true }) refHigh?: number;
  @Column({ type: 'varchar', length: 64, nullable: true }) method?: string;
  @Column({ type: 'text', nullable: true }) notes?: string;
  @Column({ length: 64, nullable: true }) tenantId?: string;

  @Column({ type: 'timestamptz' }) effectiveFrom!: Date;
  @Column({ type: 'timestamptz', nullable: true }) effectiveTo?: Date | null;
}


