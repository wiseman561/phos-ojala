import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('catalog_meta')
export class CatalogMetaEntity {
  @PrimaryColumn({ length: 64 }) bundleVersion!: string;
  @Column({ length: 64 }) source!: string;
  @Column({ length: 128 }) signedHash!: string;
  @Column({ type: 'timestamptz' }) releasedAt!: Date;
}


