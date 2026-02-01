import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { TasksService } from './tasks.service';
import { TasksCsvService } from './tasks-csv.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PaginationDto } from './dto/pagination.dto';
import { AppLoggerService } from 'src/common/services/logger.service';
import { Request } from 'express';
import { Role } from 'src/auth/enums/role.enum';

interface MulterFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}

@ApiTags('Tasks')
@ApiBearerAuth('JWT-auth')
@Controller('tasks')
export class TasksController {
  private readonly logger = new AppLoggerService();

  constructor(
    private readonly tasksService: TasksService,
    private readonly tasksCsvService: TasksCsvService,
  ) {
    this.logger.setContext('TasksController');
  }

  @Post()
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @Req() req: Request & { user: { id: number } },
  ) {
    this.logger.log('Creating a new task', {
      requestId: req.id,
      userId: req.user.id,
    });
    return this.tasksService.create(req.user.id, createTaskDto, req.id);
  }

  @Post('upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(
    @UploadedFile() file: MulterFile | undefined,
    @Req() req: Request & { user: { id: number } },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a CSV');
    }

    this.logger.log('Uploading CSV file', {
      requestId: req.id,
      userId: req.user.id,
      filename: file.originalname,
    });

    return this.tasksCsvService.uploadAndProcessCsv(file, req.user.id);
  }

  @Get()
  async findAll(
    @Req() req: Request & { user: { id: number } },
    @Query() paginationDto: PaginationDto,
  ) {
    this.logger.log('Fetching tasks', {
      requestId: req.id,
      userId: req.user.id,
    });
    return this.tasksService.findAll(req.user.id, paginationDto, req.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: { id: number } }) {
    this.logger.log('Fetching task', {
      userId: req.user.id,
      taskId: Number(id),
    });
    return this.tasksService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: { user: { id: number } },
  ) {
    this.logger.log('Updating task', {
      userId: req.user.id,
      taskId: Number(id),
    });
    return this.tasksService.update(+id, req.user.id, updateTaskDto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: { user: { id: number; role: Role } },
  ) {
    this.logger.log('Deleting task', {
      userId: req.user.id,
      taskId: Number(id),
      role: req.user.role,
    });
    console.log('yash', req.user.role);
    return this.tasksService.remove(+id, req.user.id, req.user.role);
  }
}
