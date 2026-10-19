import { createCareApi } from '../../web/lib/care-api';
import { api } from './api';
export { CARE_TOPICS, REPORT_CATEGORIES, topicLabel, statusLabel, reportCategoryLabel } from '../../web/lib/care-api';
export type { CareTopic, CareSummary, CareThread, QueueItem, PastorStatus, ReportCategory } from '../../web/lib/care-api';
export const care = createCareApi(api);
