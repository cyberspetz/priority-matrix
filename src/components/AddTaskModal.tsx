import { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (title: string, dueDate?: string, deadlineAt?: string) => void;
}

export default function AddTaskModal({ isOpen, onClose, onAddTask }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [deadlineAt, setDeadlineAt] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAddTask(title.trim(), dueDate || undefined, deadlineAt || undefined);
      setTitle('');
      setDueDate('');
      setDeadlineAt('');
      setShowDatePicker(false);
      setShowDeadlinePicker(false);
      onClose();
    }
  };

  const handleClose = () => {
    setTitle('');
    setDueDate('');
    setDeadlineAt('');
    setShowDatePicker(false);
    setShowDeadlinePicker(false);
    onClose();
  };

  // Todoist-inspired quick date options
  const getQuickDateOptions = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return [
      { label: 'Today', value: today.toISOString().split('T')[0], color: 'text-orange-600 bg-orange-50' },
      { label: 'Tomorrow', value: tomorrow.toISOString().split('T')[0], color: 'text-blue-600 bg-blue-50' },
      { label: 'Next week', value: nextWeek.toISOString().split('T')[0], color: 'text-purple-600 bg-purple-50' }
    ];
  };

  const quickDates = getQuickDateOptions();

  const formatDueDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <Transition appear show={isOpen} as="div">
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as="div"
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as="div"
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all border border-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="text-xl font-semibold text-gray-900">
                      Add New Task
                    </Dialog.Title>
                    <button
                      onClick={handleClose}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        placeholder="What needs to be done?"
                        autoFocus
                      />
                    </div>

                    {/* Due Date Section - Todoist Inspired */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Due date</label>
                        {dueDate && (
                          <button
                            type="button"
                            onClick={() => setDueDate('')}
                            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Quick Date Options */}
                      <div className="flex gap-2">
                        {quickDates.map((option) => (
                          <button
                            key={option.label}
                            type="button"
                            onClick={() => setDueDate(option.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                              dueDate === option.value
                                ? option.color + ' ring-2 ring-offset-2 ring-current'
                                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setShowDatePicker(!showDatePicker)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                        >
                          📅 Pick date
                        </button>
                      </div>

                      {/* Custom Date Picker */}
                      {showDatePicker && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => {
                              setDueDate(e.target.value);
                              setShowDatePicker(false);
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      )}

                      {/* Selected Date Display */}
                      {dueDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-700">Due: {formatDueDate(dueDate)}</span>
                        </div>
                      )}
                    </div>

                    {/* Deadline Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Deadline</label>
                        {deadlineAt && (
                          <button
                            type="button"
                            onClick={() => setDeadlineAt('')}
                            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => setShowDeadlinePicker(!showDeadlinePicker)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                        >
                          ⏰ Pick deadline
                        </button>
                      </div>

                      {showDeadlinePicker && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <input
                            type="datetime-local"
                            value={deadlineAt}
                            onChange={(e) => {
                              setDeadlineAt(e.target.value);
                              setShowDeadlinePicker(false);
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </div>
                      )}

                      {deadlineAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                          </svg>
                          <span className="text-gray-700">Deadline: {new Date(deadlineAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!title.trim()}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Add Task
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
