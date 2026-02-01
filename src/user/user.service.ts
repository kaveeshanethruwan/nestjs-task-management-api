import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { AppLoggerService } from 'src/common/services/logger.service';

@Injectable()
export class UserService {
  private readonly logger = new AppLoggerService();

  constructor(@InjectRepository(User) private UserRepo: Repository<User>) {
    this.logger.setContext('UserService');
  }

  async create(createUserDto: CreateUserDto, requestId?: string) {
    this.logger.log('Creating user in database', {
      requestId,
      email: createUserDto.email,
    });

    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      this.logger.warn('Email already exists', {
        requestId,
        email: createUserDto.email,
      });
      throw new ConflictException('Email already exists');
    }

    const user = this.UserRepo.create(createUserDto);
    const savedUser = await this.UserRepo.save(user);

    this.logger.log('User created successfully', {
      requestId,
      userId: savedUser.id,
    });

    return savedUser;
  }

  async findAll(requestId?: string) {
    this.logger.log('Fetching all users from database', { requestId });
    const users = await this.UserRepo.find();
    this.logger.log('Users fetched successfully', {
      requestId,
      count: users.length,
    });
    return users;
  }

  async findOne(id: number) {
    return await this.UserRepo.findOne({
      where: { id: id },
      select: [
        'id',
        'firstName',
        'lastName',
        'avatarUrl',
        'hashedRefreshToken',
        'role',
        'email',
      ],
    });
  }

  async findByEmail(email: string) {
    return await this.UserRepo.findOne({ where: { email } });
  }

  async update(id: number, updateUserDto: UpdateUserDto, requestId?: string) {
    this.logger.log('Updating user', { requestId, userId: id });

    const user = await this.UserRepo.findOne({ where: { id } });
    if (!user) {
      this.logger.warn('User not found for update', {
        requestId,
        userId: id,
      });
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== user.id) {
        this.logger.warn('Email conflict during update', {
          requestId,
          userId: id,
          email: updateUserDto.email,
        });
        throw new ConflictException('Email already exists');
      }
    }

    await this.UserRepo.update(id, updateUserDto);
    this.logger.log('User updated successfully', { requestId, userId: id });

    return this.findOne(id);
  }

  async remove(id: number, requestId?: string) {
    this.logger.log('Deleting user', { requestId, userId: id });

    const user = await this.UserRepo.findOne({ where: { id } });
    if (!user) {
      this.logger.warn('User not found for deletion', {
        requestId,
        userId: id,
      });
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.UserRepo.delete(id);
    this.logger.log('User deleted successfully', { requestId, userId: id });

    return { message: `User #${id} has been successfully deleted` };
  }

  async updateHashedRefreshToken(
    userId: number,
    hashedRefreshToken: string | null,
  ) {
    return await this.UserRepo.update({ id: userId }, { hashedRefreshToken });
  }
}
