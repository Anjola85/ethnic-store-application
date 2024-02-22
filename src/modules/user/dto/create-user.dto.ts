import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { MobileDto } from 'src/common/dto/mobile.dto';
import { UserProfile } from '../user.enums';
import { AddressDto } from 'src/modules/address/dto/address.dto';

/**
 * User signup DTO
 * This class has all the possible fields required to register a user
 */
export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The first name of the person', example: 'John' })
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The last name of the person', example: 'Doe' })
  lastName: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'The address of the person',
    example: {
      unit: '123',
      street: 'Street 1',
      city: 'City 1',
      province: 'Province 1',
      postalCode: '12345',
      country: 'Country 1',
    },
  })
  address: AddressDto;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'The type of user being resgistered',
    example: 'customer',
  })
  userProfile: string | UserProfile;
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MobileDto)
  @ApiProperty({
    description: 'The mobile phone number of the person',
    example: { phone_number: '1234567890', country_code: '+1', iso_type: 'CA' },
  })
  mobile: MobileDto;

  @IsOptional()
  @ApiProperty({ description: 'The Date of birth', example: '2005-06-15' })
  dob: string;

  @IsOptional()
  @ApiProperty({ type: 'string', format: 'binary' })
  profileImage: Express.Multer.File;

  @IsOptional()
  @ApiProperty({ type: 'string', format: 'binary' })
  country: string;

  @IsOptional()
  @IsEmail()
  @ApiProperty({
    description: 'The email of the person',
    example: 'test@gsil.com',
  })
  email: string;
}