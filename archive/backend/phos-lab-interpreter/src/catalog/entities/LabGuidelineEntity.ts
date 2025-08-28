import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('catalog_lab_guidelines')
@Index('IDX_guideline_loinc_tenant', ['loinc', 'tenantId'])
export class LabGuidelineEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index() @Column({ length: 64 }) loinc!: string;
  @Column({ type: 'text' }) snippet!: string;
  @Column({ type: 'jsonb' }) severityRule!: Record<string, unknown>;
  @Column({ type: 'jsonb' }) citations!: Array<{ label: string; url?: string }>;
  @Column({ type: 'date' }) accessedAt!: string;
  @Column({ length: 64 }) versionTag!: string;
}


