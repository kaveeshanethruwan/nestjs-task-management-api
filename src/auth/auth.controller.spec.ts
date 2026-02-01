/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    signOut: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should login user and return tokens', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const user = { id: 1 };
      const result = {
        userId: 1,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockResolvedValue(result);

      expect(await controller.login(dto)).toEqual(result);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        dto.email,
        dto.password,
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(1);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens', async () => {
      const req = { user: { id: 1 } } as any;
      const result = {
        userId: 1,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refreshToken.mockResolvedValue(result);

      expect(await controller.refreshToken(req)).toEqual(result);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(1);
    });
  });

  describe('signOut', () => {
    it('should sign out user', async () => {
      const req = { user: { id: 1 } } as any;

      mockAuthService.signOut.mockResolvedValue(undefined);

      await controller.signOut(req);

      expect(mockAuthService.signOut).toHaveBeenCalledWith(1);
    });
  });
});
