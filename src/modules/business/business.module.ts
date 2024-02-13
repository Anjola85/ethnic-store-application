import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './entities/business.entity';
import { BusinessRepository } from './business.repository';
import { BusinessFilesService } from '../files/business-files.service';
import { Address } from '../address/entities/address.entity';
import { CountryService } from '../country/country.service';
import { Country } from '../country/entities/country.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Business, Address, Country])],
  controllers: [BusinessController],
  providers: [
    BusinessService,
    BusinessRepository,
    BusinessFilesService,
    CountryService,
  ],
})
export class BusinessModule {}
