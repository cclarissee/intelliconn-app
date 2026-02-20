import { OrganizationMember } from '../types';
import { apiFetch } from './index';

export const getMembers = async (
  orgId: number
): Promise<OrganizationMember[]> => {
  const res = await apiFetch(`/api/organizations/${orgId}/members`);

  if (res?.success) {
    return res.data;
  }

  throw new Error(res?.error || 'Failed to fetch members');
};

export const inviteMember = async (
  orgId: number,
  userId: string,
  role: string
) => {
  const res = await apiFetch(`/api/organizations/${orgId}/members`, {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      role,
    }),
  });

  if (res?.success) {
    return res.data;
  }

  throw new Error(res?.error || 'Failed to invite member');
};

export const updateMemberRole = async (
  orgId: number,
  memberId: number,
  role: string
) => {
  const res = await apiFetch(
    `/api/organizations/${orgId}/members/${memberId}`,
    {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }
  );

  if (res?.success) {
    return res.data;
  }

  throw new Error(res?.error || 'Failed to update role');
};

export const removeMember = async (
  orgId: number,
  memberId: number
) => {
  const res = await apiFetch(
    `/api/organizations/${orgId}/members/${memberId}`,
    {
      method: 'DELETE',
    }
  );

  if (res?.success) {
    return res.data;
  }

  throw new Error(res?.error || 'Failed to remove member');
};
