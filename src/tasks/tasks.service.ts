import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from 'src/entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PaginationDto } from './dto/pagination.dto';
import { AppLoggerService } from 'src/common/services/logger.service';
import { Role } from 'src/auth/enums/role.enum';

@Injectable()
export class TasksService {
  private readonly logger = new AppLoggerService();

  constructor(@InjectRepository(Task) private taskRepo: Repository<Task>) {
    this.logger.setContext('TasksService');
  }

  async create(
    userId: number,
    createTaskDto: CreateTaskDto,
    requestId?: string,
  ) {
    this.logger.log('Creating task in database', {
      requestId,
      userId,
      title: createTaskDto.title,
    });

    const task = this.taskRepo.create({
      ...createTaskDto,
      userId,
    });
    const savedTask = await this.taskRepo.save(task);

    this.logger.log('Task created successfully', {
      requestId,
      userId,
      taskId: savedTask.id,
    });

    return savedTask;
  }

  async findAll(
    userId: number,
    paginationDto: PaginationDto,
    requestId?: string,
  ) {
    this.logger.log('Fetching tasks from database', {
      requestId,
      userId,
      page: paginationDto.page,
      limit: paginationDto.limit,
    });

    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;

    const [tasks, total] = await this.taskRepo.findAndCount({
      where: { userId },
      skip,
      take: limit,
      order: { createdAt: 'ASC' },
    });

    return {
      data: tasks,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, userId: number) {
    this.logger.log('Fetching task from database', {
      userId,
      taskId: id,
    });
    const task = await this.taskRepo.findOne({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: number, userId: number, updateTaskDto: UpdateTaskDto) {
    this.logger.log('Updating task in database', {
      userId,
      taskId: id,
    });
    const task = await this.findOne(id, userId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.taskRepo.update(id, updateTaskDto);
    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number, role: Role) {
    this.logger.log('Deleting task from database', {
      userId,
      taskId: id,
      role,
    });

    const whereCondition = role === Role.USER ? { id, userId } : { id };

    const task = await this.taskRepo.findOne({
      where: whereCondition,
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.taskRepo.delete(id);
    return { message: `Task #${id} has been successfully deleted` };
  }
}
