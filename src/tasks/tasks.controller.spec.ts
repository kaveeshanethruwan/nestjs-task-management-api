/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksCsvService } from './tasks-csv.service';
import { TaskStatus } from './enums/task-status.enum';
import { BadRequestException } from '@nestjs/common';

describe('TasksController', () => {
  let controller: TasksController;

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockTasksCsvService = {
    uploadAndProcessCsv: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
        {
          provide: TasksCsvService,
          useValue: mockTasksCsvService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const dto = { title: 'Test Task', status: TaskStatus.PENDING };
      const req = { user: { id: 1 }, id: 'req-123' } as any;
      const result = { id: 1, ...dto, userId: 1 };

      mockTasksService.create.mockResolvedValue(result);

      expect(await controller.create(dto, req)).toEqual(result);
      expect(mockTasksService.create).toHaveBeenCalledWith(1, dto, 'req-123');
    });

    it('should fail if title is missing', async () => {
      const dto = { status: TaskStatus.PENDING } as any;
      const req = { user: { id: 1 }, id: 'req-123' } as any;

      mockTasksService.create.mockRejectedValue(
        new BadRequestException('title should not be empty'),
      );

      await expect(controller.create(dto, req)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      const req = { user: { id: 1 }, id: 'req-123' } as any;
      const query = { page: 1, limit: 10 };
      const result = {
        data: [{ id: 1, title: 'Task 1' }],
        pagination: { total: 1, page: 1, limit: 10, pages: 1 },
      };

      mockTasksService.findAll.mockResolvedValue(result);

      expect(await controller.findAll(req, query)).toEqual(result);
      expect(mockTasksService.findAll).toHaveBeenCalledWith(
        1,
        query,
        'req-123',
      );
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      const req = { user: { id: 1 }, id: 'req-123' } as any;
      const result = { id: 1, title: 'Task 1', userId: 1 };

      mockTasksService.findOne.mockResolvedValue(result);

      expect(await controller.findOne('1', req)).toEqual(result);
      expect(mockTasksService.findOne).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const req = { user: { id: 1 }, id: 'req-123' } as any;
      const dto = { title: 'Updated Task' };
      const result = { id: 1, ...dto, userId: 1 };

      mockTasksService.update.mockResolvedValue(result);

      expect(await controller.update('1', dto, req)).toEqual(result);
      expect(mockTasksService.update).toHaveBeenCalledWith(1, 1, dto);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      const req = { user: { id: 1 }, id: 'req-123' } as any;
      const result = { message: 'Task #1 has been successfully deleted' };

      mockTasksService.remove.mockResolvedValue(result);

      expect(await controller.remove('1', req)).toEqual(result);
      expect(mockTasksService.remove).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('uploadCsv', () => {
    it('should upload and process CSV file', async () => {
      const file = {
        originalname: 'tasks.csv',
        buffer: Buffer.from('title,status\nTask 1,PENDING'),
        mimetype: 'text/csv',
      };
      const req = { user: { id: 1 }, id: 'req-123' } as any;
      const result = {
        totalRows: 1,
        successCount: 1,
        failureCount: 0,
        errors: [],
        s3Url: 'https://s3.example.com/file.csv',
      };

      mockTasksCsvService.uploadAndProcessCsv.mockResolvedValue(result);

      expect(await controller.uploadCsv(file, req)).toEqual(result);
      expect(mockTasksCsvService.uploadAndProcessCsv).toHaveBeenCalledWith(
        file,
        1,
      );
    });

    it('should throw error if no file uploaded', async () => {
      const req = { user: { id: 1 }, id: 'req-123' } as any;

      await expect(controller.uploadCsv(undefined, req)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
