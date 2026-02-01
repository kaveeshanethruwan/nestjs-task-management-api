/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { Role } from 'src/auth/enums/role.enum';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        role: Role.USER,
      };
      const req = { id: 'req-123' } as any;
      const result = { id: 1, ...dto };

      mockUserService.create.mockResolvedValue(result);

      expect(await controller.create(dto, req)).toEqual(result);
      expect(mockUserService.create).toHaveBeenCalledWith(dto, 'req-123');
    });
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      const req = { id: 'req-123' } as any;
      const result = [{ id: 1, firstName: 'John' }];

      mockUserService.findAll.mockResolvedValue(result);

      expect(await controller.findAll(req)).toEqual(result);
      expect(mockUserService.findAll).toHaveBeenCalledWith('req-123');
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      const req = { id: 'req-123' } as any;
      const result = { id: 1, firstName: 'John' };

      mockUserService.findOne.mockResolvedValue(result);

      expect(await controller.findOne('1', req)).toEqual(result);
      expect(mockUserService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const req = { id: 'req-123' } as any;
      const dto = { firstName: 'Jane' };
      const result = { id: 1, firstName: 'Jane' };

      mockUserService.update.mockResolvedValue(result);

      expect(await controller.update('1', dto, req)).toEqual(result);
      expect(mockUserService.update).toHaveBeenCalledWith(1, dto, 'req-123');
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const req = { id: 'req-123' } as any;
      const result = { message: 'User #1 has been successfully deleted' };

      mockUserService.remove.mockResolvedValue(result);

      expect(await controller.remove('1', req)).toEqual(result);
      expect(mockUserService.remove).toHaveBeenCalledWith(1, 'req-123');
    });
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      const req = { user: { id: 1 }, id: 'req-123' } as any;
      const result = { id: 1, firstName: 'John' };

      mockUserService.findOne.mockResolvedValue(result);

      expect(await controller.getProfile(req)).toEqual(result);
      expect(mockUserService.findOne).toHaveBeenCalledWith(1);
    });
  });
});
