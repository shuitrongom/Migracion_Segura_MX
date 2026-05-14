import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../common/enums';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Record<string, jest.Mock>;
  let jwtService: Record<string, jest.Mock>;
  let configService: Record<string, jest.Mock>;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    phone: '+5215512345678',
    passwordHash: '',
    fullName: 'Test User',
    role: UserRole.CLIENTE,
    isVerified: true,
    failedAttempts: 0,
    lockedUntil: null,
    verificationCode: null,
    verificationCodeExpiresAt: null,
    pendingEmail: null,
    pendingEmailCode: null,
    pendingEmailExpiresAt: null,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    googleId: null,
    appleId: null,
    profilePhotoUrl: null,
    is2FAEnabled: false,
    twoFASecret: null,
    lastLoginAt: null,
    lastActivityAt: null,
    fcmToken: null,
    notificationPreferences: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    // Hash a known password for testing
    const hashedPassword = await bcrypt.hash('Password123!', 12);
    mockUser.passwordHash = hashedPassword;

    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      incrementFailedAttempts: jest.fn(),
      resetFailedAttempts: jest.fn(),
      verifyUser: jest.fn(),
      updateVerificationCode: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-token'),
      verifyAsync: jest.fn(),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        const config: Record<string, string> = {
          'app.nodeEnv': 'test',
          'auth.jwtRefreshSecret': 'test-refresh-secret',
          'auth.jwtRefreshExpiration': '7d',
          'app.frontendUrl': 'http://localhost:3001',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should create a new user and return userId', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ ...mockUser, id: 'new-user-id' });

      const result = await authService.register(
        'new@example.com',
        '+5215500000000',
        'SecurePass1!',
      );

      expect(result).toHaveProperty('userId', 'new-user-id');
      expect(result).toHaveProperty('message');
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          phone: '+5215500000000',
        }),
      );
    });

    it('should throw BadRequestException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.register('test@example.com', '+5215512345678', 'Password123!'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should return tokens and user on valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.resetFailedAttempts.mockResolvedValue(undefined);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await authService.login('test@example.com', 'Password123!');

      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(result.user).toHaveProperty('email', 'test@example.com');
      expect(usersService.resetFailedAttempts).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw UnauthorizedException with wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.incrementFailedAttempts.mockResolvedValue(undefined);

      await expect(
        authService.login('test@example.com', 'WrongPassword!'),
      ).rejects.toThrow(UnauthorizedException);

      expect(usersService.incrementFailedAttempts).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login('nonexistent@example.com', 'Password123!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if account is locked', async () => {
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // locked for 30 more minutes
      };
      usersService.findByEmail.mockResolvedValue(lockedUser);

      await expect(
        authService.login('test@example.com', 'Password123!'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if account is not verified', async () => {
      const unverifiedUser = { ...mockUser, isVerified: false };
      usersService.findByEmail.mockResolvedValue(unverifiedUser);
      usersService.incrementFailedAttempts.mockResolvedValue(undefined);

      // With correct password but unverified account
      await expect(
        authService.login('test@example.com', 'Password123!'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
