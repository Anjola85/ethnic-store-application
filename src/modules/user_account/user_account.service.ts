import { Injectable } from '@nestjs/common';
import { CreateUserAccountDto } from './dto/create-user_account.dto';
import { UpdateUserAccountDto } from './dto/update-user_account.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserAccount,
  UserAccountDocument,
} from './entities/user_account.entity';
import { TempUserAccountDto } from './dto/temporary-user-account.dto';
import {
  TempUserAccount,
  TempUserAccountDocument,
} from './entities/temporary_user_account.entity';
import { MobileUtil } from 'src/common/util/mobileUtil';
import { MobileDto } from 'src/common/dto/mobile.dto';

@Injectable()
export class UserAccountService {
  constructor(
    @InjectModel(UserAccount.name)
    private userAccountModel: Model<UserAccountDocument>,
    @InjectModel(TempUserAccount.name)
    private tempUserAccountModel: Model<TempUserAccountDocument>,
  ) {}

  async create(
    userAccountDto: CreateUserAccountDto,
    userId: string,
  ): Promise<UserAccount> {
    try {
      // get data from temp auth account and delete temp auth account
      const tempUserAccount = await this.tempUserAccountModel.findById(userId);

      const { mobile, email } = tempUserAccount;

      // pass either email or mobile to userAccountDto
      if (email) {
        userAccountDto.email = email;
      } else if (mobile) {
        userAccountDto.mobile = new MobileUtil(
          mobile.isoCode,
          mobile.isoType,
          mobile.phoneNumber,
        ).getDto();
      }

      const account = new this.userAccountModel({ ...userAccountDto });
      const userAccount = await account.save();

      // if userAccount is saved successfully, delete temp user account
      if (userAccount) {
        await this.tempUserAccountModel.findByIdAndDelete(userId);
      }

      return userAccount;
    } catch (error) {
      throw new Error(
        `Error creating user account, from create method in user_account.service.ts.\nWith error message: ${error.message}`,
      );
    }
  }

  /**
   * Used to successfully verify OTP
   * @param userAccountDto
   * @returns
   */
  async createTempUserAccount(
    userAccountDto: TempUserAccountDto,
  ): Promise<any> {
    try {
      // check if user exists
      const userExists = await this.tempUserExists(
        userAccountDto.email,
        userAccountDto.mobile,
      );

      if (userExists) {
        return userExists;
      }

      const account = new this.tempUserAccountModel({ ...userAccountDto });
      const userAccount = await account.save();
      return userAccount;
    } catch (error) {
      throw new Error(
        `Error creating temporary user account, from createTempUserAccount method in user_account.service.ts. 
        With error message: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<any> {
    try {
      const users = await this.userAccountModel.find().exec();
      return users;
    } catch (error) {
      throw new Error(
        `Error retrieving users from database 
        from create method in user_account.service.ts. 
        With error message: ${error.message}`,
      );
    }
  }

  async findOne(id: string): Promise<{ message: string; data: any }> {
    try {
      const user = await this.userAccountModel.findById(id).exec();
      // throw error if user does not exist
      if (!user) {
        return { message: `User with id ${id} not found`, data: null };
      }

      if (user.deleted) {
        return { message: `User with id ${id} has been deleted`, data: null };
      }

      return { message: 'found user', data: user };
    } catch (error) {
      throw new Error(
        `Error getting user information for user with id ${id}, 
        \nfrom findOne method in user_account.service.ts. 
        \nWith error message: ${error.message}`,
      );
    }
  }

  async update(
    id: string,
    updateUserAccountDto: UpdateUserAccountDto,
  ): Promise<any> {
    try {
      const updatedAccount = await this.userAccountModel
        .findByIdAndUpdate(id, {
          ...updateUserAccountDto,
        })
        .exec();

      // check for error
      if (!updatedAccount) {
        throw new Error(
          `Error updating user account from mongoose
          method: user_account.service.ts. 
            \ndev error: account with ${id} not found`,
        );
      }
      return updatedAccount;
    } catch (error) {
      throw new Error(
        `Error updating user account, from update method in user_account.service.ts. 
        \nWith error message: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<any> {
    try {
      const account = await this.userAccountModel
        .findById(id, { deleted: 'true' })
        .exec();
      if (!account) {
        throw new Error(
          `Mongoose error with deleting user with user id ${id}
          \nIn remove method user_account.service.ts\nwith dev error message: user with id:${id} not found`,
        );
      }
      return account;
    } catch (error) {
      throw new Error(
        `Error from remove method in user_account.service.ts. 
        \nWith error message: ${error.message}`,
      );
    }
  }

  /**
   * Check if user with email exists
   * @param email
   * @returns
   * @throws Error if user with email exists
   */
  async getUserByEmail(email: string): Promise<object> {
    try {
      let user: object = null;
      user = await this.userAccountModel
        .findOne({ email: email })
        .select('-createdAt -updatedAt -__v -deleted -active');

      return user;
    } catch (error) {
      throw new Error(
        `Error fom findUserByEmail method in user_account.service.ts. 
        \nWith error message: ${error.message}`,
      );
    }
  }

  /**
   * Check if user with phone exists
   * @param phone
   * @returns
   * @throws Error if user with phone exists
   */
  async getUserByPhone(phone: MobileDto): Promise<object> {
    try {
      const phoneNum = phone.phoneNumber;
      let user: object = null;
      user = await this.userAccountModel
        .findOne({
          'mobile.phoneNumber': phoneNum,
        })
        .select('-createdAt -updatedAt -__v, -deleted -active');

      return user;
    } catch (error) {
      throw new Error(
        `Error from findUserByPhone method in user_account.service.ts. 
        \nWith error message: ${error.message}`,
      );
    }
  }

  // get user by phone or email
  async getUserByPhoneOrEmail(phone: string, email: string): Promise<any[]> {
    try {
      let user = null;
      user = await this.userAccountModel
        .find({ $or: [{ 'mobile.phoneNumber': phone }, { email: email }] })
        .exec();
      return user;
    } catch (error) {
      throw new Error(
        `Error from findUserByPhoneOrEmail method in user_account.service.ts.
        \nWith error message: ${error.message}`,
      );
    }
  }

  async userExists(email: string, mobile: MobileDto): Promise<boolean> {
    let userExists = false;

    // check if user exists in user accounts collection
    if (email != null && email != '') {
      // use email to check if user exists
      const user = await this.getUserByEmail(email);
      if (Object.keys(user).length > 0) {
        userExists = true;
      }
    } else if (mobile) {
      // use mobile to check if user exists
      const user = await this.getUserByPhone(mobile);

      if (user !== null && Object.keys(user).length > 0) {
        userExists = true;
      }
    }
    return userExists;
  }

  async tempUserExists(email: string, mobile: MobileDto): Promise<boolean> {
    let userExists = false;

    let phoneNumber;

    if (mobile) {
      phoneNumber = mobile.phoneNumber;
    }

    if (email != null && email != '') {
      const user = await this.tempUserAccountModel
        .find({ email: email })
        .exec();
      if (Object.keys(user).length > 0) {
        userExists = true;
      }
    } else if (phoneNumber != null && phoneNumber != '') {
      const user = await this.tempUserAccountModel
        .find({ 'mobile.phoneNumber': phoneNumber })
        .exec();
      if (Object.keys(user).length > 0) {
        userExists = true;
      }
    }

    return userExists;
  }

  // find user in temporary account
  async findUserInTempAccount(userId: string): Promise<any> {
    try {
      const user = await this.tempUserAccountModel.findById(userId).exec();
      return user;
    } catch (error) {
      throw new Error(
        `Error from findUserInTempAccount method in user_account.service.ts. 
        \nWith error message: ${error.message}`,
      );
    }
  }
}
