import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TasksService } from './tasks.service';
import { TasksCsvService } from './tasks-csv.service';
import { TasksController } from './tasks.controller';
import { Task } from 'src/entities/task.entity';
import { S3Service } from 'src/common/services/s3.service';
import s3Config from 'src/config/s3.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    ConfigModule.forFeature(s3Config),
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksCsvService, S3Service],
})
export class TasksModule {}
