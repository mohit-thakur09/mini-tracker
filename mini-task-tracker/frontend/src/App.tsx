import { FormEvent, useCallback, useEffect, useState } from 'react';

type Status = 'To Do' | 'In Progress' | 'Done';
type Priority = 'Low' | 'Medium' | 'High';
type Task = { _id: string; title: string; description: string; status: Status; priority: Priority; createdAt: string };
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const statuses: Status[] = ['To Do', 'In Progress', 'Done'];
const priorities: Priority[] = ['Low', 'Medium', 'High'];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'All' | Status>('All');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>('To Do');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const query = filter === 'All' ? '' : `?status=${encodeURIComponent(filter)}`;
      const response = await fetch(`${API_URL}/tasks${query}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load tasks.');
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect to the server.');
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { void loadTasks(); }, [loadTasks]);

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice(''); setSaving(true);
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, status, priority })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create task.');
      setTitle(''); setDescription(''); setStatus('To Do'); setPriority('Medium');
      setNotice('Task created successfully.');
      await loadTasks();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create task.'); }
    finally { setSaving(false); }
  }

  async function updateStatus(task: Task, nextStatus: Status) {
    setError(''); setNotice('');
    try {
      const response = await fetch(`${API_URL}/tasks/${task._id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update task.');
      setNotice('Task status updated.'); await loadTasks();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update task.'); }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setError(''); setNotice('');
    try {
      const response = await fetch(`${API_URL}/tasks/${task._id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json(); throw new Error(data.error || 'Could not delete task.');
      }
      setNotice('Task deleted.'); await loadTasks();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not delete task.'); }
  }

  return <main className="page">
    <header className="header"><div><p className="eyebrow">SIMPLE TASK MANAGEMENT</p><h1>Mini Task Tracker</h1><p className="subtitle">Keep track of what needs to get done.</p></div></header>
    <section className="panel">
      <h2>Create task</h2>
      <form onSubmit={createTask} className="task-form">
        <label className="full">Title <span className="required">*</span>
          <input value={title} onChange={e => setTitle(e.target.value)} maxLength={100} required placeholder="e.g. Complete assignment" />
          <small>{title.length}/100 characters</small>
        </label>
        <label className="full">Description <span className="muted">(optional)</span>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Add a few details" />
        </label>
        <label>Status<select value={status} onChange={e => setStatus(e.target.value as Status)}>{statuses.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Priority<select value={priority} onChange={e => setPriority(e.target.value as Priority)}>{priorities.map(value => <option key={value}>{value}</option>)}</select></label>
        <div className="full"><button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create task'}</button></div>
      </form>
    </section>

    <section className="list-section">
      <div className="list-heading"><div><h2>Tasks</h2><p className="subtitle">Your saved tasks</p></div>
        <label className="filter-label">Filter by status<select value={filter} onChange={e => setFilter(e.target.value as 'All' | Status)}><option>All</option>{statuses.map(value => <option key={value}>{value}</option>)}</select></label>
      </div>
      {error && <div className="message error" role="alert">{error}</div>}
      {notice && !error && <div className="message success" role="status">{notice}</div>}
      {loading ? <p className="state">Loading tasks…</p> : tasks.length === 0 ? <p className="state">{filter === 'All' ? 'No tasks yet. Create your first task above.' : `No tasks with status “${filter}”.`}</p> :
        <div className="task-list">{tasks.map(task => <article className="task-card" key={task._id}>
          <div className="task-content"><h3>{task.title}</h3>{task.description && <p className="description">{task.description}</p>}
            <div className="meta"><span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority} priority</span><span>Created {new Date(task.createdAt).toLocaleString()}</span></div>
          </div>
          <div className="task-actions"><label>Status<select aria-label={`Status for ${task.title}`} value={task.status} onChange={e => void updateStatus(task, e.target.value as Status)}>{statuses.map(value => <option key={value}>{value}</option>)}</select></label><button type="button" className="delete-button" onClick={() => void deleteTask(task)}>Delete</button></div>
        </article>)}</div>}
    </section>
    <footer>Mini Task Tracker</footer>
  </main>
}
