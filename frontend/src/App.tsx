import { useCallback, useEffect, useState } from 'react';
import { api, apiUrl } from './api/client';
import type {
  MemberDTO,
  ProjectDTO,
  ProjectStatus,
  SaveMemberData,
  SaveProjectData,
  SaveTaskData,
  TaskDTO,
  TaskStatus,
} from './types';
import './App.css';

type Tab = 'tasks' | 'projects' | 'members';

const TASK_STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'FINISHED'];
const PAGE_SIZE = 3;

function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function daysBetween(a: string, b: string): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86400000);
}

function todayISO(): string {
  const n = new Date();
  const mm = String(n.getMonth() + 1).padStart(2, '0');
  const dd = String(n.getDate()).padStart(2, '0');
  return `${n.getFullYear()}-${mm}-${dd}`;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('tasks');
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [allTasks, setAllTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [taskForm, setTaskForm] = useState({ title: '', description: '', numberOfDays: 1, projectId: '', memberId: '' });
  const [projectForm, setProjectForm] = useState({ name: '', description: '', initialDate: '', finalDate: '', memberIds: [] as string[] });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('PENDING');
  const [memberForm, setMemberForm] = useState({ name: '', email: '' });

  const loadBase = useCallback(async () => {
    setError('');
    try {
      const [p, m] = await Promise.all([
        api<ProjectDTO[]>('/projects'),
        api<MemberDTO[]>('/members'),
      ]);
      setProjects(p);
      setMembers(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects/members');
    }
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (titleFilter.trim()) params.set('partialTitle', titleFilter.trim());
      if (projectFilter) params.set('projectId', projectFilter);
      params.set('page', String(page));
      const data = await api<TaskDTO[]>(`/tasks?${params.toString()}`);
      if (data.length === 0 && page > 0) {
        setPage(page - 1);
        setHasMore(false);
        return;
      }
      setTasks(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, titleFilter, projectFilter, page]);

  const loadAllTasks = useCallback(async () => {
    try {
      setAllTasks(await api<TaskDTO[]>('/tasks'));
    } catch {
      // The filtered list already surfaces load errors.
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    await loadTasks();
    await loadAllTasks();
  }, [loadTasks, loadAllTasks]);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    void loadAllTasks();
  }, [loadAllTasks]);

  function validateTaskBody(body: SaveTaskData): string | null {
    if (!body.title || !body.description) return 'Title and description are required.';
    if (!body.projectId) return 'Task must be linked to a project.';
    if (!body.memberId) return 'Task must be assigned to a member of the selected project.';
    const targetProject = projects.find((p) => p.id === body.projectId);
    if (targetProject) {
      const duration = daysBetween(targetProject.initialDate, targetProject.finalDate);
      if ((body.numberOfDays ?? 0) > duration) {
        return `Task of ${body.numberOfDays} day(s) does not fit "${targetProject.name}" (project spans ${duration} day(s)).`;
      }
      const remaining = daysBetween(todayISO(), targetProject.finalDate);
      if ((body.numberOfDays ?? 0) > remaining) {
        return remaining < 0
          ? `Project "${targetProject.name}" ended on ${targetProject.finalDate}. Adjust its dates first.`
          : `Task overruns "${targetProject.name}": only ${remaining} day(s) left until ${targetProject.finalDate}.`;
      }
    }
    return null;
  }

  function resetTaskForm() {
    setTaskForm({ title: '', description: '', numberOfDays: 1, projectId: '', memberId: '' });
    setTaskStatus('PENDING');
    setEditingTaskId(null);
  }

  function startEditTask(task: TaskDTO) {
    setTaskForm({
      title: task.title,
      description: task.description,
      numberOfDays: task.numberOfDays,
      projectId: task.project?.id ?? '',
      memberId: task.assignedMember?.id ?? '',
    });
    setTaskStatus(task.status);
    setEditingTaskId(task.id);
    setError('');
  }

  async function handleSubmitTask(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const body: SaveTaskData = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      numberOfDays: taskForm.numberOfDays,
      projectId: taskForm.projectId || undefined,
      memberId: taskForm.memberId || undefined,
      ...(editingTaskId ? { status: taskStatus } : {}),
    };
    const validationError = validateTaskBody(body);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      if (editingTaskId) {
        await api<TaskDTO>(`/tasks/${editingTaskId}`, { method: 'PUT', body: JSON.stringify(body) });
        resetTaskForm();
        await refreshTasks();
      } else {
        await api<TaskDTO>('/tasks', { method: 'POST', body: JSON.stringify(body) });
        resetTaskForm();
        setStatusFilter('');
        setTitleFilter('');
        setProjectFilter('');
        setPage(0);
        await refreshTasks();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save task');
    }
  }

  async function handleDeleteTask(id: string) {
    setError('');
    try {
      await api<void>(`/tasks/${id}`, { method: 'DELETE' });
      await refreshTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete task');
    }
  }

  async function handleDeleteProject(project: ProjectDTO) {
    const linkedTasks = allTasks.filter((t) => t.project?.id === project.id).length;
    if (linkedTasks > 0) {
      setError(
        `Cannot delete "${project.name}": it still has ${linkedTasks} linked task(s). Delete or move them first.`
      );
      return;
    }
    setError('');
    try {
      await api<void>(`/projects/${project.id}`, { method: 'DELETE' });
      await loadBase();
      await refreshTasks();
    } catch {
      setError(`Cannot delete "${project.name}". It may still have linked data.`);
    }
  }

  async function handleDeleteMember(member: MemberDTO) {
    const linkedProjects = member.projectIds.length;
    const linkedTasks = allTasks.filter((t) => t.assignedMember?.id === member.id).length;
    if (linkedProjects > 0 || linkedTasks > 0) {
      setError(
        `Cannot delete "${member.name}": linked to ${linkedProjects} project(s) and ${linkedTasks} task(s). ` +
          'Unlink them first (remove from projects / delete or reassign tasks).'
      );
      return;
    }
    setError('');
    try {
      await api<void>(`/members/${member.id}`, { method: 'DELETE' });
      await loadBase();
      await refreshTasks();
    } catch {
      setError(`Cannot delete "${member.name}". They may still have linked data.`);
    }
  }

  async function handleSetProjectStatus(project: ProjectDTO, status: ProjectStatus) {
    if (status === 'FINISHED') {
      const projectTasks = allTasks.filter((t) => t.project?.id === project.id);
      const open = projectTasks.filter((t) => t.status !== 'FINISHED').length;
      if (open > 0) {
        setError(
          `Cannot finish "${project.name}": ${open} of ${projectTasks.length} task(s) still open. Finish all tasks first.`
        );
        return;
      }
    }
    setError('');
    try {
      const body: SaveProjectData = {
        name: project.name,
        description: project.description,
        initialDate: project.initialDate,
        finalDate: project.finalDate,
        status,
        memberIds: [...project.memberIds],
      };
      await api<ProjectDTO>(`/projects/${project.id}`, { method: 'PUT', body: JSON.stringify(body) });
      await loadBase();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update project status');
    }
  }

  function toggleProjectMember(memberId: string) {
    setProjectForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(memberId)
        ? prev.memberIds.filter((id) => id !== memberId)
        : [...prev.memberIds, memberId],
    }));
  }

  function memberName(id: string): string {
    return members.find((m) => m.id === id)?.name ?? id;
  }

  function projectName(id: string): string {
    return projects.find((p) => p.id === id)?.name ?? id;
  }

  const selectedProject = projects.find((p) => p.id === taskForm.projectId);
  const availableMembers = selectedProject
    ? members.filter((m) => selectedProject.memberIds.includes(m.id))
    : members;
  const selectedWindow = selectedProject
    ? {
        duration: daysBetween(selectedProject.initialDate, selectedProject.finalDate),
        remaining: daysBetween(todayISO(), selectedProject.finalDate),
      }
    : null;

  async function handleAdvanceTask(task: TaskDTO) {
    const next: Record<TaskStatus, TaskStatus | null> = {
      PENDING: 'IN_PROGRESS',
      IN_PROGRESS: 'FINISHED',
      FINISHED: null,
    };
    const status = next[task.status];
    if (!status) return;
    setError('');
    try {
      const body: SaveTaskData = {
        title: task.title,
        description: task.description,
        numberOfDays: task.numberOfDays,
        status,
        projectId: task.project?.id,
        memberId: task.assignedMember?.id,
      };
      await api<TaskDTO>(`/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify(body) });
      await refreshTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update task');
    }
  }

  function resetProjectForm() {
    setProjectForm({ name: '', description: '', initialDate: '', finalDate: '', memberIds: [] });
    setEditingProjectId(null);
  }

  function startEditProject(project: ProjectDTO) {
    setProjectForm({
      name: project.name,
      description: project.description,
      initialDate: project.initialDate,
      finalDate: project.finalDate,
      memberIds: [...project.memberIds],
    });
    setEditingProjectId(project.id);
    setError('');
  }

  async function handleSubmitProject(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const body: SaveProjectData = {
      name: projectForm.name.trim(),
      description: projectForm.description.trim(),
      initialDate: projectForm.initialDate,
      finalDate: projectForm.finalDate,
      memberIds: projectForm.memberIds,
    };
    if (!body.name || !body.description || !body.initialDate || !body.finalDate) {
      setError('Name, description and both dates are required.');
      return;
    }
    try {
      if (editingProjectId) {
        const current = projects.find((p) => p.id === editingProjectId);
        await api<ProjectDTO>(`/projects/${editingProjectId}`, {
          method: 'PUT',
          body: JSON.stringify({ ...body, status: current?.status ?? 'PENDING' }),
        });
        resetProjectForm();
      } else {
        await api<ProjectDTO>('/projects', { method: 'POST', body: JSON.stringify(body) });
        resetProjectForm();
      }
      await loadBase();
      await refreshTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save project');
    }
  }

  async function handleCreateMember(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const body: SaveMemberData = { name: memberForm.name.trim(), email: memberForm.email.trim() };
    if (!body.name || !body.email) return;
    try {
      await api<MemberDTO>('/members', { method: 'POST', body: JSON.stringify(body) });
      setMemberForm({ name: '', email: '' });
      await loadBase();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create member');
    }
  }

  return (
    <div className="pm-container">
      <header className="pm-header">
        <div>
          <h1>PManager</h1>
          <p className="pm-sub">Projects, tasks and members · API {apiUrl()}</p>
        </div>
        <nav className="pm-tabs">
          {(['tasks', 'projects', 'members'] as Tab[]).map((t) => (
            <button key={t} type="button" className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
      </header>

      {error && <p className="pm-error">{error}</p>}

      {tab === 'tasks' && (
        <section>
          <div className="pm-filters">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} aria-label="Filter by status">
              <option value="">All statuses</option>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={projectFilter} onChange={(e) => { setProjectFilter(e.target.value); setPage(0); }} aria-label="Filter by project">
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              placeholder="Search by title..."
              value={titleFilter}
              onChange={(e) => { setTitleFilter(e.target.value); setPage(0); }}
              aria-label="Search tasks by title"
            />
          </div>

          <form className="pm-form" onSubmit={handleSubmitTask}>
            <h2>{editingTaskId ? 'Edit task' : 'New task'}</h2>
            <input
              placeholder="Title"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              maxLength={80}
            />
            <input
              placeholder="Description (max 150)"
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              maxLength={150}
            />
            <input
              type="number"
              min={1}
              value={taskForm.numberOfDays}
              onChange={(e) => setTaskForm({ ...taskForm, numberOfDays: Number(e.target.value) })}
              aria-label="Number of days"
            />
            <div className="pm-row">
              <select
                value={taskForm.projectId}
                onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value, memberId: '' })}
                aria-label="Link to project (required)"
              >
                <option value="">Select a project *</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                value={taskForm.memberId}
                onChange={(e) => setTaskForm({ ...taskForm, memberId: e.target.value })}
                aria-label="Assignee (project member, required)"
              >
                <option value="">Select a project member *</option>
                {availableMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            {projects.length === 0 && (
              <small className="pm-hint">Create a project first — every task must belong to one.</small>
            )}
            {selectedProject && selectedWindow && (
              <small className="pm-info">
                Project window: {selectedProject.initialDate} → {selectedProject.finalDate}
                {' '}({selectedWindow.duration} days total,{' '}
                {selectedWindow.remaining < 0
                  ? `ended ${-selectedWindow.remaining} days ago`
                  : `${selectedWindow.remaining} days left`})
              </small>
            )}
            {taskForm.projectId && availableMembers.length === 0 && (
              <small className="pm-hint">
                This project has no members yet — link members to it in the Projects tab first.
              </small>
            )}
            {editingTaskId && (
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                aria-label="Task status"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
            <div className="pm-row">
              <button type="submit">{editingTaskId ? 'Update task' : 'Create task'}</button>
              {editingTaskId && (
                <button type="button" className="secondary" onClick={resetTaskForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          {loading ? (
            <p>Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="pm-empty">No tasks found for these filters.</p>
          ) : (
            <ul className="pm-list">
              {tasks.map((t) => (
                <li key={t.id} className="pm-card">
                  <div>
                    <strong>{t.title}</strong>
                    <span className={`pm-badge ${t.status.toLowerCase()}`}>{t.status}</span>
                    <p>{t.description}</p>
                    <small>
                      Deadline: {t.numberOfDays} {t.numberOfDays === 1 ? 'day' : 'days'}
                      {t.project ? ` · Project: ${t.project.name}` : ''}
                      {t.assignedMember ? ` · Assignee: ${t.assignedMember.name}` : ''}
                    </small>
                  </div>
                  <div className="pm-actions">
                    <button type="button" onClick={() => startEditTask(t)}>Edit</button>
                    {t.status !== 'FINISHED' && (
                      <button type="button" onClick={() => void handleAdvanceTask(t)}>Advance</button>
                    )}
                    <button type="button" className="danger" onClick={() => void handleDeleteTask(t.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="pm-pagination">
            <button type="button" disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>
              ← Prev
            </button>
            <span>Page {page + 1}</span>
            <button type="button" disabled={!hasMore || loading} onClick={() => setPage(page + 1)}>
              Next →
            </button>
          </div>
        </section>
      )}

      {tab === 'projects' && (
        <section>
          <form className="pm-form" onSubmit={handleSubmitProject}>
            <h2>{editingProjectId ? 'Edit project' : 'New project'}</h2>
            <input
              placeholder="Name"
              value={projectForm.name}
              onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
              maxLength={80}
            />
            <input
              placeholder="Description (max 150)"
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              maxLength={150}
            />
            <div className="pm-row">
              <input
                type="date"
                value={projectForm.initialDate}
                onChange={(e) => setProjectForm({ ...projectForm, initialDate: e.target.value })}
                aria-label="Initial date"
              />
              <input
                type="date"
                value={projectForm.finalDate}
                onChange={(e) => setProjectForm({ ...projectForm, finalDate: e.target.value })}
                aria-label="Final date"
              />
            </div>
            <fieldset className="pm-checks">
              <legend>Members in this project (N-N)</legend>
              {members.length === 0 && <small>No members yet — create one in the Members tab.</small>}
              {members.map((m) => (
                <label key={m.id}>
                  <input
                    type="checkbox"
                    checked={projectForm.memberIds.includes(m.id)}
                    onChange={() => toggleProjectMember(m.id)}
                  />
                  {m.name}
                </label>
              ))}
            </fieldset>
            <div className="pm-row">
              <button type="submit">{editingProjectId ? 'Update project' : 'Create project'}</button>
              {editingProjectId && (
                <button type="button" className="secondary" onClick={resetProjectForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          <ul className="pm-list">
            {projects.map((p) => {
              const projectTasks = allTasks.filter((t) => t.project?.id === p.id);
              const finished = projectTasks.filter((t) => t.status === 'FINISHED').length;
              const open = projectTasks.length - finished;
              const canFinish = projectTasks.length > 0 && open === 0;
              return (
                <li key={p.id} className="pm-card">
                  <div>
                    <strong>{p.name}</strong>
                    <span className={`pm-badge ${p.status.toLowerCase()}`}>{p.status}</span>
                    <p>{p.description}</p>
                    <small>{p.initialDate} → {p.finalDate}</small>
                    <small className="pm-links">
                      Members: {p.memberIds.length === 0 ? '—' : p.memberIds.map(memberName).join(', ')}
                    </small>
                    <small className="pm-links">
                      Tasks: {projectTasks.length === 0 ? '—' : `${finished}/${projectTasks.length} finished`}
                    </small>
                  </div>
                  <div className="pm-actions">
                    <button type="button" onClick={() => startEditProject(p)}>Edit</button>
                    {p.status !== 'FINISHED' ? (
                      <button
                        type="button"
                        disabled={!canFinish}
                        title={
                          projectTasks.length === 0
                            ? 'Project has no tasks yet'
                            : open > 0
                              ? `${open} task(s) still open`
                              : 'All tasks finished — ready to close'
                        }
                        onClick={() => void handleSetProjectStatus(p, 'FINISHED')}
                      >
                        Finish
                      </button>
                    ) : (
                      <button type="button" onClick={() => void handleSetProjectStatus(p, 'IN_PROGRESS')}>
                        Reopen
                      </button>
                    )}
                    <button type="button" className="danger" onClick={() => void handleDeleteProject(p)}>
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {tab === 'members' && (
        <section>
          <form className="pm-form" onSubmit={handleCreateMember}>
            <h2>New member</h2>
            <input
              placeholder="Name"
              value={memberForm.name}
              onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
              maxLength={80}
            />
            <input
              type="email"
              placeholder="Email"
              value={memberForm.email}
              onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
            />
            <button type="submit">Create member</button>
          </form>

          <ul className="pm-list">
            {members.map((m) => (
              <li key={m.id} className="pm-card">
                <div>
                  <strong>{m.name}</strong>
                  <p>{m.email}</p>
                  <small className="pm-links">
                    Projects: {m.projectIds.length === 0 ? '—' : m.projectIds.map(projectName).join(', ')}
                  </small>
                </div>
                <div className="pm-actions">
                  <button type="button" className="danger" onClick={() => void handleDeleteMember(m)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
