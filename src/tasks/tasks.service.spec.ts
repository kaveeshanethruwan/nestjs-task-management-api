import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from 'src/entities/task.entity';
import { NotFoundException } from '@nestjs/common';
import { TaskStatus } from './enums/task-status.enum';

describe('TasksService', () => {
  let service: TasksService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const dto = { title: 'Test Task', status: TaskStatus.PENDING };
      const task = { id: 1, ...dto, userId: 1 };

      mockRepository.create.mockReturnValue(task);
      mockRepository.save.mockResolvedValue(task);

      const result = await service.create(1, dto);

      expect(result).toEqual(task);
      expect(mockRepository.create).toHaveBeenCalledWith({ ...dto, userId: 1 });
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      const tasks = [{ id: 1, title: 'Task 1' }];
      const paginationDto = { page: 1, limit: 10 };

      mockRepository.findAndCount.mockResolvedValue([tasks, 1]);

      const result = await service.findAll(1, paginationDto);

      expect(result).toEqual({
        data: tasks,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          pages: 1,
        },
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId: 1 },
        skip: 0,
        take: 10,
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a task', async () => {
      const task = { id: 1, title: 'Task 1', userId: 1 };

      mockRepository.findOne.mockResolvedValue(task);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(task);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const task = { id: 1, title: 'Task 1', userId: 1 };
      const updated = { ...task, title: 'Updated Task' };

      mockRepository.findOne.mockResolvedValueOnce(task);
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValueOnce(updated);

      const result = await service.update(1, 1, { title: 'Updated Task' });

      expect(result).toEqual(updated);
      expect(mockRepository.update).toHaveBeenCalledWith(1, {
        title: 'Updated Task',
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, 1, { title: 'Updated Task' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      const task = { id: 1, title: 'Task 1', userId: 1 };

      mockRepository.findOne.mockResolvedValue(task);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(1, 1);

      expect(result).toEqual({
        message: 'Task #1 has been successfully deleted',
      });
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
