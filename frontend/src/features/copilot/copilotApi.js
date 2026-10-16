import { apiClient } from '../../services/apiClient';

export const copilotApi = {
  sendMessage: async (message, context = {}) => {
    return apiClient('/copilot/query', {
      method: 'POST',
      body: { message, context },
    });
  },

  proposeAction: async (actionType, payload) => {
    return apiClient('/copilot/propose-action', {
      method: 'POST',
      body: { action_type: actionType, payload },
    });
  },

  getSuggestions: async () => {
    return apiClient('/copilot/suggestions');
  },
};
