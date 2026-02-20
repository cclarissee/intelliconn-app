import { Organization } from '../types';
import { apiFetch } from './index';

export const getOrganizations = async (): Promise<Organization[]> => {
  const res = await apiFetch('/api/organizations');

  if (res?.success) {
    return res.data;
  }

  throw new Error(res?.error || 'Failed to fetch organizations');
};

export const createOrganization = async (
  orgData: Partial<Organization>
): Promise<Organization> => {
  const res = await apiFetch('/api/organizations', {
    method: 'POST',
    body: JSON.stringify(orgData),
  });

  if (res?.success) {
    return res.data;
  }

  throw new Error(res?.error || 'Failed to create organization');
};
