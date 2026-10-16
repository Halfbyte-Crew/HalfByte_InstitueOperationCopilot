import { apiClient } from '../../services/apiClient';

export const coursesApi = {
  getCourses: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/courses${query ? `?${query}` : ''}`);
  },

  getCourseById: async (id) => {
    return apiClient(`/courses/${id}`);
  },

  createCourse: async (data) => {
    return apiClient('/courses', { method: 'POST', body: data });
  },

  updateCourse: async (id, data) => {
    return apiClient(`/courses/${id}`, { method: 'PATCH', body: data });
  },
};
