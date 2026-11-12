export type UserRole = 'facilitator' | 'supervisor' | 'b1_task' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  approvalStatus?: ApprovalStatus;
  accessCode?: string; // Individual one-time activation code assigned to this user
  accessCodeUsed?: string;
  approvedAt?: string;
  assignedProjectIds?: string[];
  createdAt: string;
}

export interface B1TaskSubmission {
  id?: string;
  projectId: string;
  projectTitle: string;
  sector?: string; // 'education' | 'health' | 'agriculture' | 'wash' | 'humanitarian' | 'other'
  collectorId: string;
  collectorName: string;
  collectorEmail: string;
  locationName: string;
  lga?: string;
  gpsLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  photoUrl?: string;
  answers: Record<string, any>;
  notes?: string;
  createdAt: string;
}

export interface HireTaskInquiry {
  id?: string;
  clientName: string;
  contactEmail: string;
  contactPhone?: string;
  sector: string;
  locations: string;
  description: string;
  targetCount?: number;
  status: 'new' | 'contacted' | 'project_created';
  createdAt: string;
}

export type QuestionType = 'text' | 'number' | 'boolean' | 'select';

export interface CustomSurveyQuestion {
  id: string;
  label: string;
  type: QuestionType;
  options?: string[]; // For select type
  required: boolean;
}

export type ProjectStatus = 'active' | 'completed' | 'paused';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  targetSubmissions: number;
  lga?: string;
  guide?: string; // Enumerator/facilitator field guide instructions
  customQuestions?: CustomSurveyQuestion[];
  assignedUserIds?: string[]; // IDs of facilitators and supervisors assigned
  createdAt: string;
  createdBy: string;
}

export interface ClassReport {
  id?: string;
  projectId?: string;
  projectTitle?: string;
  facilitatorId: string;
  facilitatorName: string;
  lga: string; // 1. LGA
  learningCenterName: string; // 2. Learning Center Name
  date: string; // 4. Date of lesson (YYYY-MM-DD)
  totalRegisteredLearners: number; // 5. Total registered learners
  attendance: number; // 6. Total learners present today
  boysCount: number; // 7. No. of boys
  girlsCount: number; // 8. No. of girls
  lessonNumber: string; // 9. Lesson number
  topics: string; // 10. Lesson taught
  radioLessonDelivered: boolean; // 11. Was today's radio lesson delivered
  radioLessonReasonNotDelivered?: string; // If not delivered, "why"
  lessonCompleted: boolean; // 12. Was today's lesson completed
  workbookUsed: boolean; // 13. Did the learner use the workbook
  engagementLevel: number; // 1-5 rating
  learnerUnderstanding?: string; // 14. Learner understanding assessment
  hasSafetyConcerns: boolean; // 15. Any safety concerns?
  safetyConcernsDetails?: string; // Details if safety concerns
  photoUrl?: string; // Student/classroom picture capture (base64 compressed)
  customAnswers?: Record<string, any>; // Answers to project-specific questions
  notes?: string;
  createdAt: string;
}

export interface VisitReport {
  id?: string;
  projectId?: string;
  projectTitle?: string;
  supervisorId: string;
  supervisorName: string; // 3. Name of supervisor
  facilitatorId?: string; // UID if linked
  facilitatorName: string; // 3. Facilitator's name
  lga: string; // 1. LGA
  learningCenterName: string; // 2. Learning Center Name
  date: string; // Date of visit
  time: string; // Time of visit
  gpsLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }; // GPS coordinates
  totalRegisteredLearners: number; // 5. Total registered learners
  attendance: number; // 6. Total learners present today
  boysCount: number; // 7. No. of boys
  girlsCount: number; // 8. No. of girls
  lessonNumber: string; // 9. Lesson number
  topics: string; // 10. Lesson taught
  radioLessonDelivered: boolean; // 11. Was today's radio lesson delivered
  radioLessonReasonNotDelivered?: string; // If not delivered, "why"
  lessonCompleted: boolean; // 12. Was today's lesson completed
  workbookUsed: boolean; // 13. Did the learner use the workbook
  learnerUnderstanding: string; // 14. How did the learner understand
  hasSafetyConcerns: boolean; // 15. Any safety concerns?
  safetyConcernsDetails?: string; // Details if safety concerns
  classroomCondition: string; // Classroom conditions
  resourcesAvailable: boolean; // Resources available
  recommendations?: string; // Supervisor recommendations
  photoUrl?: string; // Picture captured for student/classroom
  customAnswers?: Record<string, any>;
  createdAt: string;
}
