export interface CsvUploadResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: CsvRowError[];
  s3Url: string;
}

export interface CsvRowError {
  row: number;
  data: any;
  errors: string[];
}

export interface TaskCsvRow {
  title: string;
  description?: string;
  status?: string;
}
