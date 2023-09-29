import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class GeoLocationDto {
  @ApiProperty({
    description: 'Type',
    default: 'Point',
  })
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    // [latitude, longitude]
    description: 'Coordinates',
    example: [0, 0],
    type: [Number],
    minItems: 2,
    maxItems: 2,
    items: {
      type: 'number',
      example: 0,
    },
  })
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  coordinates = [];
}
