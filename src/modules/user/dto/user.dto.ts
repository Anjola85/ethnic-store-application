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
import { Favourite } from 'src/modules/favourite/entities/favourite.entity';
import { BusinessDto } from 'src/modules/business/dto/business.dto';
import { CreateAuthDto } from 'src/modules/auth/dto/create-auth.dto';

/**
 * Generic DTO
 * This class has all the possible fields required to register a user
 */
export class UserDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'User ID',
    example: '00733fab-e715-41be-ad9d-dc417ae60858',
  })
  id: string;

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
  address: AddressDto[];

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'The type of user being resgistered',
    example: 'customer',
  })
  userProfile: string | UserProfile;

  @IsOptional()
  @IsEmail()
  @ApiProperty({
    description: 'The email address of the person',
    example: 'johndoe@quickie.com',
  })
  email: string;

  @IsOptional()
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
  @ApiProperty({ description: 'test-description', example: 'test-value' })
  favourites: BusinessDto[];

  @IsOptional()
  @ApiProperty({ type: 'string', format: 'binary' })
  profileImage: Express.Multer.File;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'test-description', example: 'test-value' })
  profileImageUrl: string;

  @IsOptional()
  auth: CreateAuthDto;
}
