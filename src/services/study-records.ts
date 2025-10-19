import { http } from './http';

export interface StudyRecord {
  id: string;
  subject: string;
  startedAt: string;
  endedAt: string;
  timeSpentMinutes: number;
}

export interface StudyRecordListResponse {
  records: StudyRecord[];
  total: number;
  totalMinutes: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  filteredTotal: number;
  filteredTotalMinutes: number;
}

export interface StudyRecordFiltersResponse {
  subjects: string[];
  totalRecords: number;
}

export interface ListStudyRecordsOptions {
  subject?: string;
  grade?: string;
  offset?: number;
  limit?: number;
}

export async function listStudyRecords(options?: ListStudyRecordsOptions): Promise<StudyRecordListResponse> {
  const params = new URLSearchParams();
  
  if (options?.subject && options.subject !== 'all') {
    params.append('subject', options.subject);
  }
  
  if (options?.grade && options.grade !== 'all') {
    params.append('grade', options.grade);
  }
  
  if (options?.offset !== undefined) {
    params.append('offset', options.offset.toString());
  }
  
  if (options?.limit !== undefined) {
    params.append('limit', options.limit.toString());
  }
  
  const queryString = params.toString();
  const url = queryString ? `/users/records?${queryString}` : '/users/records';
  
  return http<StudyRecordListResponse>(url);
}

export async function getRecordFilters(): Promise<StudyRecordFiltersResponse> {
  return http<StudyRecordFiltersResponse>('/users/records/filters');
}

export async function createStudyRecord(payload: { subject: string; startedAt: string; endedAt: string }): Promise<{ record: StudyRecord }> {
  return http<{ record: StudyRecord }>('/users/records', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteStudyRecord(recordId: string): Promise<{ success: boolean }> {
  return http<{ success: boolean }>(`/users/records/${recordId}`, {
    method: 'DELETE',
  });
}
