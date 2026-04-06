import { apiClient } from './client';

export interface Account {
  id: string;
  name: string;
  accountType: string;
  accountGroupId: string;
}

export const accountsApi = {
  async list(): Promise<Account[]> {
    return apiClient.get('/api/accounts');
  }
};
