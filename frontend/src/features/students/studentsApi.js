import { apiClient } from '../../services/apiClient';

export const studentsApi = {
  getStudents: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/students${query ? `?${query}` : ''}`);
  },

  getStudentById: async (id) => {
    return apiClient(`/students/${id}`);
  },

  createStudent: async (studentData) => {
    return apiClient('/students', {
      method: 'POST',
      body: studentData,
    });
  },

  updateStudent: async (id, studentData) => {
    return apiClient(`/students/${id}`, {
      method: 'PATCH',
      body: studentData,
    });
  },

  deleteStudent: async (id) => {
    return apiClient(`/students/${id}`, {
      method: 'DELETE',
    });
  },
};
