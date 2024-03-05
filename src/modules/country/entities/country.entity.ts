import { Business } from 'src/modules/business/entities/business.entity';
import { CommonEntity } from 'src/modules/common/base.entity';
import { Region } from 'src/modules/region/entities/region.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from 'typeorm';

export type CountryDocument = Country & Document;

@Entity('country')
export class Country extends CommonEntity {
  @Column({ type: 'varchar', length: 15, unique: true })
  name: string;

  @ManyToOne(() => Region, (region) => region.name)
  @JoinColumn({ name: 'region_id' })
  regionId: Region;

  @ManyToMany(() => Business, (business) => business.countries)
  @JoinTable() // This decorator is used to specify the owner side of the relationship.
  businesses: Business[];

  @BeforeInsert()
  @BeforeUpdate()
  lowercaseFields() {
    this.name = this.name.toLowerCase();
  }
}
