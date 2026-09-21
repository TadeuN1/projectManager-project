export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
export type ProjectStatus = 'PENDING' | 'IN_PROGRESS' | 'FINISHED';

export interface MemberDTO {
  id: string;
  secret: string;
  name: string;
  email: string;
  projectIds: string[];
}

export interface ProjectDTO {
  id: string;
  name: string;
  description: string;
  initialDate: string;
  finalDate: string;
  status: ProjectStatus;
  memberIds: string[];
}

export interface TaskDTO {
  id: string;
  title: string;
  description: string;
  numberOfDays: number;
  status: TaskStatus;
  project: ProjectDTO | null;
  assignedMember: MemberDTO | null;
}

export interface SaveTaskData {
  title: string;
  description: string;
  numberOfDays: number;
  status?: TaskStatus;
  projectId?: string;
  memberId?: string;
}

export interface SaveProjectData {
  name: string;
  description: string;
  initialDate: string;
  finalDate: string;
  status?: ProjectStatus;
  memberIds?: string[];
}

export interface SaveMemberData {
  name: string;
  email: string;
}
