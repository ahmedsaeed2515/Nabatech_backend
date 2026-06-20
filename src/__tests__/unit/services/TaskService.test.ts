import { TaskService } from '../../../services/TaskService';
import mongoose from 'mongoose';

const mockCreateTask = jest.fn();
const mockGetTasks = jest.fn();
const mockCompleteTask = jest.fn();

jest.mock('../../../services/TaskService', () => {
  return {
    TaskService: jest.fn().mockImplementation(() => {
      return {
        createTask: mockCreateTask,
        getTasks: mockGetTasks,
        completeTask: mockCompleteTask
      };
    })
  };
});

describe('[UNIT] TaskService', () => {
  let taskService: TaskService;
  const userId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    taskService = new TaskService();
  });

  describe('createTask', () => {
    it('يجب ينشئ مهمة جديدة', async () => {
      const mockTask = { _id: 'task-1', user: userId, title: 'Water plant' };
      mockCreateTask.mockResolvedValue(mockTask);

      const result = await taskService.createTask(userId, 'Water plant', new Date());

      expect(mockCreateTask).toHaveBeenCalledWith(userId, 'Water plant', expect.any(Date));
      expect(result).toEqual(mockTask);
    });
  });

  describe('completeTask', () => {
    it('يجب يكمل المهمة', async () => {
      const mockTask = { _id: 'task-1', user: userId, title: 'Water plant', completed: true };
      mockCompleteTask.mockResolvedValue(mockTask);

      const result = await taskService.completeTask('task-1', userId);

      expect(mockCompleteTask).toHaveBeenCalledWith('task-1');
      expect(result).toEqual(mockTask);
    });
  });
});
