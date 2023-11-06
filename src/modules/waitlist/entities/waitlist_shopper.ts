import { EntityMobileDto } from 'src/common/dto/mobile.dto';
import { CommonEntity } from 'src/modules/common/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('waitlist_shopper')
export class WaitlistShopper extends CommonEntity {
  @Column({ type: 'varchar', name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', name: 'mobile' })
  mobile: EntityMobileDto;

  @Column({ type: 'varchar', name: 'email' })
  email: string;

  @Column({ type: 'varchar', name: 'zip_code' })
  zipCode: string;

  @Column({ type: 'varchar', name: 'age' })
  age: string;
}
