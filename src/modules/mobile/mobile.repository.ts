import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Mobile, MobileParams } from './mobile.entity';
import { Auth } from '../auth/entities/auth.entity';
import { Business } from '../business/entities/business.entity';

@Injectable()
export class MobileRepository extends Repository<Mobile> {
  private readonly logger = new Logger(MobileRepository.name);

  constructor(private dataSource: DataSource) {
    super(Mobile, dataSource.createEntityManager());
  }

  /**
   * Adds mobile for customer
   */
  async addMobile(mobile: Mobile, params: MobileParams) {
    if (params.business && typeof params.business != 'string')
      mobile.business = params.business;
    else if (params.auth && typeof params.auth != 'string') {
      // set mobile as primary
      mobile.isPrimary = true;
      // initialize auth
      mobile.auth = params.auth;
    } else {
      throw new Error(
        'Must specify if mobile is for business or user before adding to DB',
      );
    }

    // add mobile
    try {
      const newMobile = await this.createQueryBuilder('mobile')
        .insert()
        .into(Mobile)
        .values(mobile)
        .execute();
      return newMobile;
    } catch (error) {
      this.logger.error(
        `Error thrown in addMobile method in  mobilee.repository.ts, with error message: ${error.message}`,
      );
      // TODO: test and make sure this error bubbles up
      throw new Error('Unable to add mobile to  database');
    }
  }

  /**
   *
   * @param params business id, auth id or mobile
   * @returns - Mobile[]
   */
  async getMobile(mobile: Mobile): Promise<Mobile> {
    try {
      const mobileEntity = await this.createQueryBuilder('mobile')
        .where('mobile.phone_number = :phoneNumber', {
          phoneNumber: mobile.phoneNumber,
        })
        .andWhere('mobile.country_code = :countryCode', {
          countryCode: mobile.countryCode,
        })
        .andWhere('mobile.iso_type = :isoType', {
          isoType: mobile.isoType,
        })
        .leftJoinAndSelect('mobile.auth', 'auth') // Join and select the auth relation
        .getOne();

      return mobileEntity;
    } catch (error) {
      this.logger.error(
        `Error thrown in mobile.repository.ts, getMobile method: ${error.message}`,
      );
      throw new Error('Unable to retrieve mobile from the database');
    }
  }

  async getMobileArr(params: MobileParams): Promise<Mobile[]> {
    try {
      if (
        (params.auth && typeof params.auth == 'string') ||
        (params.business && typeof params.business == 'string') ||
        params.mobile
      ) {
        // grab auth using either business or authId
        let mobileArray;

        if (params.mobile) {
          // retrieve record by mobile object
          mobileArray = await this.createQueryBuilder('mobile')
            .where('mobile.phone_number = :phoneNumber', {
              phoneNumber: params.mobile.phoneNumber,
            })
            .andWhere('mobile.country_code = :countryCode', {
              countryCode: params.mobile.countryCode,
            })
            .andWhere('mobile.iso_type = :isoType', {
              isoType: params.mobile.isoType,
            })
            .getOne();
        } else {
          // get by auth id or business id
          mobileArray = await this.createQueryBuilder('mobile')
            .where('mobile.id = :id', { id: params.mobile })
            .orWhere('mobile.auth.id = :id', { id: params.auth })
            .orWhere('mobile.business.id = :id', { id: params.business })
            .getMany();
        }

        return mobileArray ? mobileArray : [];
      }
    } catch (error) {
      this.logger.error(
        `Error thrown in mobile.repository.ts, getMobile method: ${error.message}`,
      );
      throw new Error('Unable to retrieve mobile from the database');
    }
  }

  /**
   * Changes the primary mobile for an existing user
   * @param mobile
   * @param params
   * @returns
   */
  async updateMobile(mobile: Mobile, params: MobileParams) {
    try {
      // find the mobile to update
      if (
        (params.auth && typeof params.auth == 'string') ||
        (params.business && typeof params.business == 'string') ||
        (params.mobile && typeof params.mobile == 'string')
      ) {
        // grab mobile using either business or authId or mobileId
        const existingMobile = await this.createQueryBuilder('mobile')
          .where('mobile.id = :id', { id: params.mobile })
          .orWhere('mobile.auth.id = :id', { id: params.auth })
          .orWhere('mobile.business.id = :id', { id: params.business })
          .getOne();
        existingMobile.isPrimary = false;

        // update mobile
        existingMobile.save();

        // add new mobile
        const newMobile = await this.addMobile(mobile, params);

        return newMobile;
      }
    } catch (error) {
      this.logger.error(
        `Error thrown in mobile.repository.ts, updateMobile method: ${error.message}`,
      );
      throw new Error('Unable to update mobile in the database');
    }
  }

  /**
   * Admin function to delete mobile
   * @param params
   */
  async deleteMobile(params: MobileParams) {
    try {
      // find the mobile to delete
      if (
        (params.auth && typeof params.auth == 'string') ||
        (params.business && typeof params.business == 'string') ||
        (params.mobile && typeof params.mobile == 'string')
      ) {
        // grab mobile using either business or authId or mobileId
        const existingMobile = await this.createQueryBuilder('mobile')
          .where('mobile.id = :id', { id: params.mobile })
          .orWhere('mobile.auth.id = :id', { id: params.auth })
          .orWhere('mobile.business.id = :id', { id: params.business })
          .getOne();

        // delete mobile
        return existingMobile.remove();
      }
    } catch (error) {}
  }
}