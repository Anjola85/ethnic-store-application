import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as fs from 'fs';
import * as jsonwebtoken from 'jsonwebtoken';
import { Auth, AuthParams } from './entities/auth.entity';
import { SendgridService } from 'src/providers/otp/sendgrid/sendgrid.service';
import TwilioService from 'src/providers/otp/twilio/twilio.service';
import { User } from '../user/entities/user.entity';
import { MobileDto } from 'src/common/dto/mobile.dto';
import { secureLoginDto } from './dto/secure-login.dto';
import { AuthRepository } from './auth.repository';
import { UserDto } from '../user/dto/user.dto';
import { UserFileService } from '../files/user-files.service';
import { mobileToEntity } from 'src/common/mapper/mobile-mapper';
import { CreateAuthDto } from './dto/create-auth.dto';
import { MobileRepository } from '../mobile/mobile.repository';
import { Mobile } from '../mobile/mobile.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private authRepository: AuthRepository,
    private mobileRepository: MobileRepository,
    private readonly sendgridService: SendgridService,
    private readonly twilioService: TwilioService,
    private readonly userFileService: UserFileService,
  ) {}

  /**
   * Sends otp to provided email or mobile
   * @param email
   * @param mobile
   * @returns
   */
  async sendOtp(
    email?: string,
    mobile?: MobileDto,
  ): Promise<{ message; code; expiryTime; token }> {
    try {
      let response: { message; code; expiryTime };

      // TODO: replace this with a call to the microservice to handle call to sendgrid and twilio through Kafka or RabbitMQ
      // if (mobile && mobile?.phoneNumber)
      //   response = await this.twilioService.sendSms(mobile.phoneNumber);
      // else if (email) response = await this.sendgridService.sendOTPEmail(email);

      // TODO: take out below - debug mode
      response = {
        code: '123456',
        expiryTime: new Date(Date.now() + 60000),
        message: 'OTP sent successfully',
      };

      const authModel: Auth = new Auth();

      Object.assign(authModel, {
        email,
        otpCode: response.code,
        otpExpiry: response.expiryTime,
      });

      // if mobile was provided, check if mobile exists in the database(means auth exists)
      if (mobile && mobile.phoneNumber) {
        // check if mobile exists in the DB
        const mobileArray: Mobile = await this.mobileRepository.getMobile({
          mobile,
        });

        const mobileExist = mobileArray ? mobileArray[0] : null;

        let auth: Auth;

        if (mobileExist) {
          auth = mobileExist.auth;
          await this.authRepository.update(auth.id, {
            ...authModel,
          });
        } else {
          auth = await this.authRepository.create(authModel).save();
          let newMobile = new Mobile();
          // set new mobile as primary
          newMobile.isPrimary = true;
          Object.assign(newMobile, {
            ...mobile,
            auth,
          });
          newMobile = await this.mobileRepository.create(newMobile).save();
          newMobile.auth = auth;
        }

        authModel.id = auth.id;
      } else {
        let authAcct = await this.authRepository.findOneBy({ email });
        if (authAcct) {
          await this.authRepository.update(authAcct.id, {
            ...authModel,
          });
        } else {
          authAcct = await this.authRepository.create(authModel).save();
        }

        authModel.id = authAcct.id;
      }

      // generate token with user id
      const token = this.generateJwt(authModel.id);

      // return response with token
      const otpResponse = { ...response, token };

      return otpResponse;
    } catch (error) {
      // catch database errors and throw a new error for the controller to handle
      this.logger.error(`From AuthService.sendOtp: ${error.message}`);

      throw new Error(`From AuthService.sendOtp: ${error.message}`);
    }
  }

  async verifyOtp(
    authId: string,
    otp: string,
  ): Promise<{ message: string; status: boolean }> {
    this.logger.debug(`Verifying OTP for authId: ${authId}`);
    const auth = await this.authRepository.findOneBy({ id: authId });

    if (auth == null) throw new Error('Could not find associated account');

    const expiryTime = new Date(auth.otpExpiry).toISOString();

    const entryTime = new Date(Date.now()).toISOString();

    if (entryTime <= expiryTime) {
      if (otp === auth.otpCode) {
        await this.authRepository.update(authId, {
          ...auth,
          accountVerified: true,
        });

        return { message: 'OTP successfully verified', status: true };
      } else {
        // return { message: 'OTP has expired', status: false };
        throw new UnauthorizedException('OTP does not match');
      }
    } else {
      //return { message: 'OTP does not match', status: false };
      throw new UnauthorizedException('OTP has expired');
    }
  }

  async findByEmailOrMobile(
    email: string,
    mobileDto: MobileDto,
  ): Promise<Auth> {
    try {
      const mobile = mobileToEntity(mobileDto);

      const auth = await this.authRepository
        .createQueryBuilder('auth')
        .where('auth.email = :email', { email })
        .orWhere('auth.mobile = :mobile', {
          mobile,
        })
        .leftJoinAndSelect('auth.user', 'user')
        .getOne();

      return auth || null;
    } catch (e) {
      throw new Error(
        `Error from findByEmailOrMobile method in auth.service.ts.
        with error message: ${e.message}`,
      );
    }
  }

  // method to update auth account user id
  async updateAuthUserId(authId: string, user: User): Promise<any> {
    try {
      if (!authId) throw new Error('authId is required');
      if (!user) throw new Error('user is required');

      const auth = await this.authRepository.update(authId, {
        user,
      });
      return auth;
    } catch (e) {
      throw new Error(
        `Error from updateAuthUserId method in auth.service.ts.
        with error message: ${e.message}`,
      );
    }
  }

  // method to update auth account email or mobile
  async updateAuthEmailOrMobile(
    authId: string,
    authDto: CreateAuthDto,
  ): Promise<any> {
    if (!authId) throw new Error('authId is required');
    if (!authDto) throw new Error('authDto is required');
    if (!authDto.email && !authDto.mobile)
      throw new Error('email or mobile is required');
    const auth = await this.authRepository.updateAuth(authId, authDto);
    return auth;
  }

  /**
   *
   * @param loginDto
   * @returns
   */
  async login(loginDto: secureLoginDto): Promise<any> {
    try {
      const input: AuthParams = {
        email: loginDto.email,
      };
      const authAcct = await this.getAllUserInfo(input);

      if (!authAcct) throw new Error('Invalid credentials');

      if (!authAcct.user)
        throw new Error(
          'User has incomlete registeration, please complete registeration',
        );

      const userAcct = authAcct.user;

      // generate token with userID
      const token = this.generateJwt(userAcct.id);

      // const user: UserDto = mapAuthToUser(authAcct);
      const user: UserDto = null;

      return { token, user };
    } catch (e) {
      throw new Error(`From AuthService.login: ${e.message}`);
    }
  }

  async getAllUserInfo(input: AuthParams): Promise<Auth> {
    const auth = await this.authRepository.getUserWithAuth(input);
    return auth || null;
  }

  /**
   * Generates jwt token with 1 day expiration
   * @param id
   * @returns jwt token
   */
  public generateJwt(id: string) {
    const privateKey = fs.readFileSync('./secrets/private_key.pem');
    const token = jsonwebtoken.sign({ id }, privateKey.toString(), {
      expiresIn: '1d',
    });
    return token;
  }

  /**
   * Retrieves a specific value from the auth repository
   * @param input
   * @returns auth object containing the vlaue
   */
  async getAuth(input: AuthParams): Promise<Auth> {
    const auth = await this.authRepository.findByUniq(input);
    return auth || null;
  }

  // async deleteRegisteredUsers() {
  //   // so for all accounts in the user and auth account, delete them
  //   const last24Hours = new Date();
  //   last24Hours.setHours(last24Hours.getHours() - 24);

  //   const formattedLast24Hours = last24Hours
  //     .toISOString()
  //     .slice(0, 19)
  //     .replace('T', ' ');

  //   try {
  //     // Delete all auth accounts created in the last 24 hours
  //     const deleteAuthQuery = `DELETE FROM auth WHERE createdTime <= '${formattedLast24Hours}'`;
  //     const deleteUserQuery = `DELETE FROM user WHERE createdTime <= '${formattedLast24Hours}'`;
  //     const deleteAddQuery = `DELETE FROM address WHERE createdTime <= '${formattedLast24Hours}'`;

  //     await this.authRepository.createQueryBuilder(deleteAuthQuery);
  //     await this.userRepository.createQueryBuilder(deleteUserQuery);
  //     await this.addressRepository.createQueryBuilder(deleteAddQuery);
  //   } catch (error) {}
  // }
}
