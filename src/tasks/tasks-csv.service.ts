import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from 'src/entities/task.entity';
import { TaskStatus } from './enums/task-status.enum';
import { S3Service } from 'src/common/services/s3.service';
import { AppLoggerService } from 'src/common/services/logger.service';
import * as csvParser from 'csv-parser';
import { Readable } from 'stream';
import {
  CsvUploadResult,
  CsvRowError,
  TaskCsvRow,
} from './interfaces/csv-upload.interface';

interface MulterFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}

@Injectable()
export class TasksCsvService {
  private readonly logger = new AppLoggerService();

  constructor(
    @InjectRepository(Task) private taskRepo: Repository<Task>,
    private s3Service: S3Service,
  ) {
    this.logger.setContext('TasksCsvService');
  }

  async uploadAndProcessCsv(
    file: MulterFile,
    userId: number,
  ): Promise<CsvUploadResult> {
    this.logger.log('Starting CSV upload', {
      userId,
      filename: file.originalname,
      size: file.buffer.length,
    });

    // Upload CSV to S3
    const s3Key = `tasks-csv/${userId}/${Date.now()}-${file.originalname}`;
    const s3Url = await this.s3Service.uploadFile(
      s3Key,
      file.buffer,
      'text/csv',
    );

    this.logger.log('CSV uploaded to S3', {
      userId,
      s3Key,
      s3Url,
    });

    // Parse CSV and create tasks
    const rows = await this.parseCsv(file.buffer);
    const result = await this.processCsvRows(rows, userId);

    this.logger.log('CSV processed', {
      userId,
      totalRows: result.totalRows,
      successCount: result.successCount,
      failureCount: result.failureCount,
    });

    return {
      ...result,
      s3Url,
    };
  }

  private async parseCsv(buffer: Buffer): Promise<TaskCsvRow[]> {
    return new Promise((resolve, reject) => {
      const rows: TaskCsvRow[] = [];
      const stream = Readable.from(buffer);

      stream
        .pipe(csvParser())
        .on('data', (data: TaskCsvRow) => rows.push(data))
        .on('end', () => {
          this.logger.debug('CSV parsed', { rowCount: rows.length });
          resolve(rows);
        })
        .on('error', (error) => {
          this.logger.error('CSV parse error', undefined, {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          reject(error);
        });
    });
  }

  private async processCsvRows(
    rows: TaskCsvRow[],
    userId: number,
  ): Promise<Omit<CsvUploadResult, 's3Url'>> {
    this.logger.debug('Processing CSV rows', {
      userId,
      totalRows: rows.length,
    });
    const errors: CsvRowError[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // +2 because row 1 is header, and i is 0-indexed
      const row = rows[i];

      const validationErrors = this.validateRow(row);

      if (validationErrors.length > 0) {
        errors.push({
          row: rowNumber,
          data: row,
          errors: validationErrors,
        });
        failureCount++;
        continue;
      }

      try {
        await this.createTaskFromRow(row, userId);
        successCount++;
      } catch (error) {
        errors.push({
          row: rowNumber,
          data: row,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        });
        failureCount++;
      }
    }

    return {
      totalRows: rows.length,
      successCount,
      failureCount,
      errors,
    };
  }

  private validateRow(row: TaskCsvRow): string[] {
    this.logger.debug('Validating CSV row', {
      title: row.title,
      status: row.status,
    });
    const errors: string[] = [];

    // Validate title (required)
    if (!row.title || row.title.trim() === '') {
      errors.push('Title is required');
    }

    // Validate status (optional, but must be valid if provided)
    if (row.status && row.status.trim() !== '') {
      const validStatuses = Object.values(TaskStatus);
      if (!validStatuses.includes(row.status as TaskStatus)) {
        errors.push(
          `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        );
      }
    }

    return errors;
  }

  private async createTaskFromRow(
    row: TaskCsvRow,
    userId: number,
  ): Promise<Task> {
    this.logger.debug('Creating task from CSV row', {
      userId,
      title: row.title,
      status: row.status,
    });
    const task = this.taskRepo.create({
      title: row.title.trim(),
      description: row.description?.trim() || null,
      status: (row.status?.trim() as TaskStatus) || TaskStatus.PENDING,
      userId,
    });

    return await this.taskRepo.save(task);
  }
}
