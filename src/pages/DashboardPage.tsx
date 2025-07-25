import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Pencil, MoreVertical, Trash2, Plus, Search, GripVertical, Check, Ellipsis } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useTaskStore } from '../stores/useTaskStore';
import type { Task, TaskStatus } from '../types';
import { Button } from '../components/ui/Button';

function TaskItem({
  task,
  isDraggable,
  draggedTaskId,
  dragHandlers,
  editingTaskId,
  setEditingTaskId,
}: {
  task: Task;
  isDraggable: boolean;
  draggedTaskId: string | null;
  dragHandlers: {
    onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
    onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: React.DragEvent<HTMLLIElement>) => void;
    onDrop: (e: React.DragEvent<HTMLLIElement>, taskId: string) => void;
    onDragEnter: (e: React.DragEvent<HTMLLIElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLLIElement>) => void;
  };
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
}) {
  const { updateTask, deleteTask, loading } = useTaskStore(state => ({
    updateTask: state.updateTask,
    deleteTask: state.deleteTask,
    loading: state.loading
  }));
  const isEditing = task.id === editingTaskId;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isDragging = draggedTaskId === task.id;

  // State for the edit form
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.split('T')[0] : ''); // Format for <input type="date">
  const [tags, setTags] = useState(task.tags.join(', '));

  const handleToggleStatus = () => {
    if (loading) return;
    let newStatus: TaskStatus;
    if (task.status === 'incomplete') {
      newStatus = 'pending';
    } else if (task.status === 'pending') {
      newStatus = 'complete';
    } else { // 'complete'
      newStatus = 'incomplete';
    }
    updateTask(task.id, { status: newStatus });
  };

  const handleCancel = useCallback(() => {
    // Reset form fields to original task values
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setTags(task.tags.join(', '));
    setEditingTaskId(null);
    setIsMenuOpen(false);
  }, [task, setEditingTaskId]);

  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, handleCancel]);

  const handleSave = async () => {
    if (loading) return;
    const updatedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    const updatedDueDate = dueDate ? new Date(dueDate).toISOString() : null;

    await updateTask(task.id, {
      title,
      description,
      dueDate: updatedDueDate,
      tags: updatedTags,
    });
    setEditingTaskId(null);
    setIsMenuOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      deleteTask(task.id);
    }
    setIsMenuOpen(false);
  };

  return (
    <li
      className={`bg-card border rounded-lg transition-all duration-200 ease-in-out ${isDragging ? 'opacity-30' : ''}`}
      onDragOver={isEditing ? undefined : dragHandlers.onDragOver}
      onDrop={isEditing ? undefined : (e) => dragHandlers.onDrop(e, task.id)}
      onDragEnter={isEditing ? undefined : dragHandlers.onDragEnter}
      onDragLeave={isEditing ? undefined : dragHandlers.onDragLeave}
      data-task-id={task.id}
    >
      {/* Display View */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isEditing ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
        <div className="p-4 flex items-start gap-4">
          <div className="flex flex-col items-center gap-2 pt-1">
            <button
              onClick={handleToggleStatus}
              disabled={loading}
              className={`h-5 w-5 rounded flex items-center justify-center cursor-pointer transition-all ${task.status === 'incomplete' ? 'border-2 border-input' : ''
                } ${task.status === 'pending' ? 'bg-yellow-400 text-yellow-900' : ''
                } ${task.status === 'complete' ? 'bg-primary text-primary-foreground' : ''
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={
                task.status === 'incomplete' ? 'Mark task as pending' :
                  task.status === 'pending' ? 'Mark task as complete' :
                    'Mark task as incomplete'
              }
            >
              {task.status === 'pending' && <Ellipsis className="h-4 w-4" />}
              {task.status === 'complete' && <Check className="h-4 w-4" />}
            </button>
            {isDraggable && (
              <div
                className="cursor-move touch-none"
                draggable
                onDragStart={(e) => dragHandlers.onDragStart(e, task.id)}
                onDragEnd={dragHandlers.onDragEnd}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-grow">
            <div className="cursor-pointer" onClick={() => setEditingTaskId(task.id)}>
              <h3 className={`font-bold ${task.status === 'complete' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</h3>
              {task.description && <p className={`text-sm text-foreground/70 mt-1 ${task.status === 'complete' ? 'line-through' : ''}`}>{task.description}</p>}
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-x-4 gap-y-1 flex-wrap">
              {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
            </div>
            {task.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {task.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div className="relative flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open task menu</span>
            </Button>
            {isMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-card border rounded-md shadow-lg z-10"
                onMouseLeave={() => setIsMenuOpen(false)}
              >
                <ul className="py-1">
                  <li>
                    <button
                      onClick={() => { setEditingTaskId(task.id); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-secondary flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Task
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Task
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit View */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${!isEditing ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
        <div className="p-4 flex flex-col gap-4">
          <div className="space-y-4">
            <div>
              <label htmlFor={`edit-title-${task.id}`} className="block mb-1.5 text-sm font-medium text-foreground/80">Title</label>
              <input
                id={`edit-title-${task.id}`}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground border-input font-bold"
              />
            </div>
            <div>
              <label htmlFor={`edit-desc-${task.id}`} className="block mb-1.5 text-sm font-medium text-foreground/80">Description</label>
              <input
                id={`edit-desc-${task.id}`}
                type="text"
                placeholder="Notes (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground border-input"
              />
            </div>
            <div>
              <label htmlFor={`edit-due-${task.id}`} className="block mb-1.5 text-sm font-medium text-foreground/80">Due Date</label>
              <input
                id={`edit-due-${task.id}`}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground border-input"
              />
            </div>
            <div>
              <label htmlFor={`edit-tags-${task.id}`} className="block mb-1.5 text-sm font-medium text-foreground/80">Tags (comma-separated)</label>
              <input
                id={`edit-tags-${task.id}`}
                type="text"
                placeholder="e.g. personal, work"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground border-input"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleCancel} disabled={loading} size="sm">Cancel</Button>
            <Button onClick={handleSave} disabled={loading} size="sm">
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}

function AddTaskForm({ taskListId, onClose }: { taskListId: string, onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const addTask = useTaskStore((state) => state.addTask);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the title input when the form is mounted
    titleInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      const taskTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      const taskDueDate = dueDate ? new Date(dueDate).toISOString() : null;

      await addTask({
        taskListId,
        title,
        description,
        // @ts-expect-error - dueDate is a string
        dueDate: taskDueDate,
        tags: taskTags,
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setTags('');
      onClose();
    } catch (err) {
      console.error('Failed to add task:', err);
      setError('Failed to add task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-lg bg-card border">
      <h3 className="font-semibold mb-4">Add a new task</h3>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <div className="space-y-4">
        <div>
          <label htmlFor="new-task-title" className="block mb-1.5 text-sm font-medium text-foreground/80">Title</label>
          <input
            ref={titleInputRef}
            id="new-task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md bg-background text-foreground border-input font-bold"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="new-task-desc" className="block mb-1.5 text-sm font-medium text-foreground/80">Description</label>
          <input
            id="new-task-desc"
            type="text"
            placeholder="Notes (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background text-foreground border-input"
            disabled={isSubmitting}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="new-task-due" className="block mb-1.5 text-sm font-medium text-foreground/80">Due Date</label>
            <input
              id="new-task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-foreground border-input"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="new-task-tags" className="block mb-1.5 text-sm font-medium text-foreground/80">Tags</label>
            <input
              id="new-task-tags"
              type="text"
              placeholder="e.g. personal, work"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-foreground border-input"
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Task'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { taskLists, tasks, loading, fetchTaskLists, fetchTasks, reorderTasks } = useTaskStore();
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [isAddTaskFormOpen, setIsAddTaskFormOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalEnter = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;

      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement).isContentEditable
      );

      // Don't open if a form is already open, or if user is typing,
      if (isAddTaskFormOpen || isTyping || activeEl?.tagName === 'BUTTON') {
        return;
      }

      // Don't open if no view is selected
      if (!selectedView) {
        return;
      }

      // Prevent default behavior (like submitting a form if one happens to be around)
      e.preventDefault();
      setIsAddTaskFormOpen(true);
    };

    window.addEventListener('keydown', handleGlobalEnter);
    return () => {
      window.removeEventListener('keydown', handleGlobalEnter);
    };
  }, [isAddTaskFormOpen, selectedView]);

  useEffect(() => {
    if (user) {
      fetchTaskLists(user.id);
    }
  }, [user, fetchTaskLists]);

  useEffect(() => {
    if (taskLists.length > 0 && !selectedView) {
      const defaultList = taskLists.find(list => list.id === user?.defaultTaskListId) || taskLists[0];
      setSelectedView(defaultList.id);
    }
  }, [taskLists, selectedView, user]);

  useEffect(() => {
    if (selectedView) {
      fetchTasks(selectedView);
    }
  }, [selectedView, fetchTasks]);

  const allTags = [...new Set(tasks.flatMap(task => task.tags))].sort();

  const tasksForView = useMemo(() => {
    return tasks
      .filter(task => task.taskListId === selectedView)
      .sort((a, b) => a.order - b.order);
  }, [tasks, selectedView]);

  const filteredTasks = tasksForView.filter(task => {
    const searchMatch = searchQuery.toLowerCase() === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());

    const tagsMatch = selectedTags.length === 0 ||
      selectedTags.every(tag => task.tags.includes(tag));

    const statusMatch = statusFilter === 'all' || task.status === statusFilter;

    return searchMatch && tagsMatch && statusMatch;
  });

  const dragHandlers = {
    onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
      setDraggedTaskId(taskId);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', taskId);
      document.body.classList.add('dragging');
    },

    onDragOver: (e: React.DragEvent<HTMLLIElement>) => {
      e.preventDefault();
    },

    onDrop: (e: React.DragEvent<HTMLLIElement>, targetTaskId: string) => {
      e.preventDefault();
      e.currentTarget.classList.remove('bg-secondary');

      if (!draggedTaskId || draggedTaskId === targetTaskId || !selectedView) {
        return;
      }

      const currentTasks = [...tasksForView];
      const draggedIndex = currentTasks.findIndex(t => t.id === draggedTaskId);
      const targetIndex = currentTasks.findIndex(t => t.id === targetTaskId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const [draggedItem] = currentTasks.splice(draggedIndex, 1);
      currentTasks.splice(targetIndex, 0, draggedItem);

      const orderedTaskIds = currentTasks.map(t => t.id);
      reorderTasks(selectedView, orderedTaskIds);
    },

    onDragEnter: (e: React.DragEvent<HTMLLIElement>) => {
      e.preventDefault();
      if (e.currentTarget.dataset.taskId !== draggedTaskId) {
        e.currentTarget.classList.add('bg-secondary');
      }
    },

    onDragLeave: (e: React.DragEvent<HTMLLIElement>) => {
      e.currentTarget.classList.remove('bg-secondary');
    },

    onDragEnd: () => {
      document.body.classList.remove('dragging');
      setDraggedTaskId(null);
    }
  };

  if (!user) {
    return (
      <main className="container mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold">Please log in to see your dashboard.</h1>
      </main>
    );
  }

  if (loading && taskLists.length === 0) {
    return <main className="container mx-auto p-4 md:p-8">Loading...</main>;
  }

  const selectedListName = taskLists.find(list => list.id === selectedView)?.name;

  return (
    <main className="min-h-screen mx-auto px-4 pt-4 pb-96 md:p-8 bg-[radial-gradient(var(--color-secondary)_1px,transparent_0)] [background-size:16px_16px] md:!px-[20vw]">
      <div className="w-full">
        <div>
          <div className="flex items-center justify-between mb-4">
            {selectedListName && <h2 className="text-2xl font-semibold">{selectedListName}</h2>}
            <div className="flex items-center gap-2">
              {selectedView && !isAddTaskFormOpen && (
                <Button onClick={() => setIsAddTaskFormOpen(true)} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                  <span className="hidden md:inline ml-2 text-xs opacity-70">[Enter]</span>
                </Button>
              )}
            </div>
          </div>

          <div className="mb-6 rounded-lg bg-card border">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-md bg-background text-foreground border-input"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 p-4 border-t">
              {(['all', 'incomplete', 'pending', 'complete'] as const).map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'accent' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="rounded-full capitalize"
                >
                  {status}
                </Button>
              ))}
              {allTags.map(tag => (
                <Button
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'accent' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                    );
                  }}
                  className="rounded-full"
                >
                  {tag}
                </Button>
              ))}
              {selectedTags.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedTags([])} className="rounded-full">
                  Clear
                </Button>
              )}
            </div>
          </div>

          {selectedView && (
            <div className="mb-6">
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isAddTaskFormOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {isAddTaskFormOpen && (
                  <AddTaskForm
                    taskListId={selectedView}
                    onClose={() => setIsAddTaskFormOpen(false)}
                  />
                )}
              </div>
            </div>
          )}

          {loading && tasksForView.length === 0 ? (
            <p>Loading tasks...</p>
          ) : filteredTasks.length > 0 ? (
            <ul className="space-y-4">
              {filteredTasks.map((task: Task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isDraggable={true}
                  draggedTaskId={draggedTaskId}
                  dragHandlers={dragHandlers}
                  editingTaskId={editingTaskId}
                  setEditingTaskId={setEditingTaskId}
                />
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground mt-8">
              {tasksForView.length > 0
                ? "No tasks match your filters."
                : "No tasks in this list. Add one above!"}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}