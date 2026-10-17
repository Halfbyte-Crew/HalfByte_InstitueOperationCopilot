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

  queryKnowledgeBase: async (question, topK = 4, category = null) => {
    return apiClient('/copilot/rag/query', {
      method: 'POST',
      body: { question, top_k: topK, category },
    });
  },

  listDocuments: async () => {
    return apiClient('/copilot/rag/documents');
  },
};
