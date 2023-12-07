import {
  entityToMobile,
  mobileToEntity,
} from 'src/common/mapper/mobile-mapper';
import { Business } from './entities/business.entity';
import { BusinessDto } from './dto/business.dto';
import {
  addressDtoToEntity,
  entityToAddressDto,
} from '../address/address-mapper';

export function businessDtoToEntity(businessData: BusinessDto): Business {
  const businessEntity = new Business();
  businessEntity.user = businessData.user;
  businessEntity.country = businessData.country;
  businessEntity.other_countries = businessData.otherCountries;
  businessEntity.categories = businessData.categories;
  businessEntity.name = businessData.name;
  businessEntity.description = businessData.description;
  businessEntity.address = addressDtoToEntity(businessData.address);
  businessEntity.email = businessData.email;
  businessEntity.schedule = businessData.schedule;
  businessEntity.website = businessData.website;
  businessEntity.rating = businessData.rating;
  businessEntity.mobile = {
    primary: mobileToEntity(businessData.mobile.primary),
    secondary: mobileToEntity(businessData.mobile.secondary),
  };
  businessEntity.geolocation = businessData.geolocation;
  businessEntity.business_type = businessData.businessType;
  businessEntity.images = businessData.images;
  return businessEntity;
}

export function entityToBusinessDto(business: Business): BusinessDto {
  const businessDto = new BusinessDto();
  businessDto.user = business.user;
  businessDto.country = business.country;
  businessDto.otherCountries = business.other_countries;
  businessDto.categories = business.categories;
  businessDto.name = business.name;
  businessDto.description = business.description;
  businessDto.address = entityToAddressDto(business.address);
  businessDto.email = business.email;
  businessDto.schedule = business.schedule;
  businessDto.website = business.website;
  businessDto.rating = business.rating;
  businessDto.mobile = {
    primary: entityToMobile(business.mobile.primary),
    secondary: entityToMobile(business.mobile.secondary),
  };
  businessDto.geolocation = business.geolocation;
  businessDto.businessType = business.business_type;
  return businessDto;
}