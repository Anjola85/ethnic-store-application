import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { BaseDto } from 'src/common/dto/base.dto';
import { Business } from 'src/modules/business/entities/business.entity';
import { User } from 'src/modules/user/entities/user.entity';

export class AddressDto extends BaseDto {
  @ApiProperty()
  @IsOptional()
  primary: boolean;

  @ApiProperty({ example: '123' })
  @IsOptional()
  @IsString()
  unit: string;

  @ApiProperty({ example: '123 Main St' })
  @IsNotEmpty()
  @IsString()
  street: string;

  @ApiProperty({ example: 'Toronto' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'Ontario' })
  @IsNotEmpty()
  @IsString()
  province: string;

  @ApiProperty({ example: 'Q1Z 3KL' })
  @IsNotEmpty()
  @IsString()
  postalCode: string;

  @ApiProperty({ example: 'Canada' })
  @IsNotEmpty()
  @IsString()
  country: string;

  @IsOptional()
  user: User = null;

  @IsOptional()
  business: Business = null;
}
