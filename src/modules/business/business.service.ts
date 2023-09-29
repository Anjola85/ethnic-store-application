import { BusinessRepository } from './business.repository';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateBusinessDto } from './dto/create-business.dto';
import { Repository } from 'typeorm';
import {
  BusinessFilesService,
  BusinessImages,
} from '../files/business-files.service';
import { ImagesDto } from './dto/image.dto';
import { Address } from '../address/entities/address.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { mapBusinessData } from './business-mapper';
import { GeoLocationDto } from './dto/geolocation.dto';

@Injectable()
export class BusinessService {
  constructor(
    private businessRepository: BusinessRepository,
    private businessFileService: BusinessFilesService,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
  ) {}

  async register(createBusinessDto: CreateBusinessDto): Promise<any> {
    // console.log('recieved request in service with body: ', createBusinessDto);

    // check if business exists
    await this.checkBusinessExist(createBusinessDto);

    const { featuredImage, backgroundImage, logoImage, ...businessData } =
      createBusinessDto;

    // data mapping for address
    const addressData = new Address();
    Object.assign(addressData, businessData.address);
    addressData.postal_code = businessData.address.postalCode;
    const address = await this.addressRepository.create(addressData);

    // map business data
    const businessEntity = mapBusinessData(createBusinessDto, address);

    let business = await this.businessRepository.create(businessEntity);

    // save the address id to the business table
    address.business = business;
    address.save();

    let businessName = business.name;
    // replace the space in the business name with underscore
    businessName = businessName.replace(/\s/g, '_');

    const businessImages: BusinessImages = {
      business_id: businessName,
      background_blob: backgroundImage,
      logo_blob: logoImage,
      feature_image_blob: featuredImage,
    };
    //console.log('businessImages: ', businessImages);
    // upload the images to s3 bucket and get the url
    const imagesUrl: ImagesDto =
      await this.businessFileService.uploadBusinessImages(businessImages);

    const images: ImagesDto = {
      background: imagesUrl.background,
      featured: imagesUrl.featured,
      logo: imagesUrl.logo,
    };

    // save the image url to the database
    business.images = images;

    business = await business.save();

    return business;
  }

  private async checkBusinessExist(
    createBusinessDto: CreateBusinessDto,
  ): Promise<void> {
    const businessExists = await this.businessRepository.findByName(
      createBusinessDto.name,
    );

    if (businessExists) {
      throw new HttpException(
        `Business with name ${businessExists.name} already exists`,
        HttpStatus.CONFLICT,
      );
    }
  }

  async findNearbyBusinesses(geolocationDto: GeoLocationDto): Promise<any> {
    const businesses = await this.businessRepository.findNearbyBusinesses(
      geolocationDto,
    );

    return businesses;
  }

  // async findAll() {
  //   try {
  //     const businesses = await this.businessModel.find().exec();
  //     return businesses;
  //   } catch (error) {
  //     throw new Error(
  //       `Error retrieving all businesses from mongo
  //       \nfrom findAll method in business.service.ts.
  //       \nWith error message: ${error.message}`,
  //     );
  //   }
  // }

  // async findOne(id: string): Promise<any> {
  //   try {
  //     const business = await this.businessModel.findById(id).exec();
  //     // throw error if business does not exist
  //     if (!business) {
  //       throw new Error(`business with id ${id} not found`);
  //     }

  //     if (business.deleted) {
  //       throw new Error(`business with id ${id} has been deleted`);
  //     }

  //     return business;
  //   } catch (error) {
  //     throw new Error(
  //       `Error getting business information for business with id ${id},
  //       \nfrom findOne method in business.service.ts.
  //       \nWith error message: ${error.message}`,
  //     );
  //   }
  // }

  // async update(
  //   id: string,
  //   updateBusinessDto: UpdateBusinessDto,
  // ): Promise<void> {
  //   try {
  //     await this.businessModel.updateOne({
  //       _id: id,
  //       ...updateBusinessDto,
  //     });
  //   } catch (error) {
  //     throw new Error(
  //       `Error update business information for business with id ${id},
  //       \nfrom update method in business.service.ts.
  //       \nWith error message: ${error.message}`,
  //     );
  //   }
  // }

  // async remove(id: string): Promise<any> {
  //   try {
  //     const business = await this.businessModel
  //       .findById(id, { deleted: 'true' })
  //       .exec();

  //     if (!business) {
  //       throw new Error(
  //         `Mongoose error with deleting business with business id ${id}
  //         In remove method business.service.ts with dev error message: business with id:${id} not found`,
  //       );
  //     }

  //     return business;
  //   } catch (error) {
  //     throw new Error(
  //       `Error from remove method in business.service.ts.
  //       \nWith error message: ${error.message}`,
  //     );
  //   }
  // }

  // /**
  //  * Find business by name
  //  * @param name
  //  * @returns
  //  */
  // async findBusinessByName(name: string): Promise<any> {
  //   try {
  //     const business = await this.businessModel.find({ name }).exec();
  //     return business;
  //   } catch (error) {
  //     throw new Error(
  //       `Error from findBusinessByName method in business.service.ts.
  //         \nWith error message: ${error.message}`,
  //     );
  //   }
  // }

  // /**
  //  * Find all businesses with this category name
  //  * @returns {*} - businesses belonging to this category
  //  */
  // async findByCategory(categoryName: string): Promise<any> {
  //   try {
  //     // get businesses with this category name
  //     const business = await this.businessModel
  //       .find({ 'category.name': categoryName })
  //       .exec();

  //     return business;
  //   } catch (error) {
  //     throw new Error(
  //       `Error from findByCategory method in business.service.ts.
  //       \nWith error message: ${error.message}`,
  //     );
  //   }
  // }

  // /**
  //  * Find all businesses with this country name
  //  * @param countryName
  //  * @returns {*} - businesses belonging to this country
  //  */
  // async findByCountry(countryName: string): Promise<any> {
  //   try {
  //     // get businesses with this country name
  //     const business = await this.businessModel
  //       .find({ 'country.name': countryName })
  //       .exec();

  //     return business;
  //   } catch (error) {
  //     throw new Error(`Error from findByCountry method in business.service.ts.
  //     \nWith error message: ${error.message}`);
  //   }
  // }

  // /**
  //  * Find all businesses with this continent name
  //  * @param continentName
  //  * @returns {*} - businesses belonging to this continent
  //  */
  // async findByContinent(continentName: string): Promise<any> {
  //   try {
  //     // get businesses with this continent name
  //     const business = await this.businessModel
  //       .find({ 'continent.name': continentName })
  //       .exec();

  //     return business;
  //   } catch (error) {
  //     throw new Error(
  //       `Error from findByCategory method in business.service.ts.
  //       \nWith error message: ${error.message}`,
  //     );
  //   }
  // }

  // async findStoresNearby(
  //   latitude: number,
  //   longitude: number,
  //   radius: number,
  // ): Promise<Business[]> {
  //   try {
  //     const coordinates = [latitude, longitude];
  //     const businesses = await this.businessModel
  //       .find({
  //         geolocation: {
  //           $near: {
  //             $geometry: {
  //               type: 'Point',
  //               coordinates,
  //             },
  //             $maxDistance: radius,
  //           },
  //         },
  //       })
  //       .exec();

  //     return businesses;
  //   } catch (error) {
  //     throw new Error(
  //       `Error from findStoresNearby method in business.service.ts.
  //       \nWith error message: ${error.message}`,
  //     );
  //   }
  // }
}
