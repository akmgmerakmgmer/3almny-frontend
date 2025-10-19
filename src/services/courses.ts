import { http } from './http';

export interface CourseRecommendation {
  title: string;
  platform: string;
  url: string;
  description: string;
  language: 'en' | 'ar';
}

export interface CourseRecommendationsPayload {
  courses: CourseRecommendation[];
  language: 'en' | 'ar';
  topic?: string;
}

export async function getCourseRecommendations(params: {
  topic?: string;
  language?: 'en' | 'ar';
  count?: number;
} = {}): Promise<CourseRecommendationsPayload> {
  const qs = new URLSearchParams();
  if (params.topic) qs.set('topic', params.topic);
  if (params.language) qs.set('language', params.language);
  if (params.count) qs.set('count', String(params.count));
  const query = qs.toString();
  const path = `/chats/courses/recommendations${query ? `?${query}` : ''}`;
  return http<CourseRecommendationsPayload>(path);
}
