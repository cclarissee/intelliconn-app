import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Shield, Trash2, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as membersApi from '../api/members';
import { OrganizationMember } from '../types';

interface RoleManagementProps {
  organizationId: number;
}

const INTELLICONN = {
  primary: '#0A3D91',
  secondary: '#1565C0',
  accent: '#00C2FF',
  background: '#F4F7FB',
  card: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
};

const roles = [
  { id: 'owner', name: 'Owner', description: 'Full access to everything including billing and member management.', color: '#FECACA' },
  { id: 'admin', name: 'Admin', description: 'Can manage post content, members, and organization.', color: '#E9D5FF' },
  { id: 'editor', name: 'Editor', description: 'Can create, edit, and publish the post contents.', color: '#BFDBFE' },
  { id: 'approver', name: 'Approver', description: 'Can review and approve content before publishing.', color: '#BBF7D0' },
];

export default function RoleManagement({ organizationId }: RoleManagementProps) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviting, setInviting] = useState(false);

  useEffect(() => { fetchMembers(); }, [organizationId]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await membersApi.getMembers(organizationId);
      setMembers(data);
    } catch (err) {
      console.error('Fetch members error:', err);
    } finally {
      setLoading(false);
    }
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await membersApi.inviteMember(organizationId, inviteEmail, inviteRole);
      await fetchMembers();
      setInviteEmail('');
      setInviteRole('editor');
      setShowInviteModal(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to invite member.');
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (memberId: number) => {
    Alert.alert('Remove Member', 'Are you sure you want to remove this member?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await membersApi.removeMember(organizationId, memberId);
          fetchMembers();
        }
      }
    ]);
  };

  const getRoleInfo = (roleId: string) =>
    roles.find(role => role.id === roleId) || roles[2];

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: INTELLICONN.background }}>
        <ActivityIndicator size="large" color={INTELLICONN.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: INTELLICONN.background }}
      contentContainerStyle={{ padding: 20 }}
    >

      {/* Gradient Header */}
      <LinearGradient
        colors={[INTELLICONN.primary, INTELLICONN.secondary]}
        style={{ padding: 20, borderRadius: 20, marginBottom: 24 }}
      >
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>
          Team Management
        </Text>
        <Text style={{ color: '#CFE3FF', marginTop: 6 }}>
          Manage members and permissions.
        </Text>
      </LinearGradient>

      {/* Role Permissions */}
      <View style={{
        backgroundColor: INTELLICONN.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 6,
      }}>
        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 14, color: INTELLICONN.primary }}>
          Role Permissions
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {roles.map(role => (
            <View key={role.id} style={{
              width: '48%',
              backgroundColor: role.color,
              padding: 12,
              borderRadius: 12,
              marginBottom: 12,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Shield size={16} color="#374151" style={{ marginRight: 6 }} />
                <Text style={{ fontWeight: '600' }}>{role.name}</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#4B5563' }}>
                {role.description}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Members */}
      <View style={{
        backgroundColor: INTELLICONN.card,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 6,
      }}>
        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 16, color: INTELLICONN.primary }}>
          Team Members ({members.length})
        </Text>

        {members.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Users size={48} color={INTELLICONN.textSecondary} />
            <Text style={{ marginTop: 8, color: INTELLICONN.textSecondary }}>
              No team members yet
            </Text>

            <TouchableOpacity
              onPress={() => setShowInviteModal(true)}
              style={{
                marginTop: 14,
                backgroundColor: INTELLICONN.primary,
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', paddingHorizontal: 9, paddingVertical: 4, }}>
                Invite Member
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const roleInfo = getRoleInfo(item.role);
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 2 }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: INTELLICONN.primary,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 10
                    }}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>
                        {item.user_id.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontWeight: '600', color: INTELLICONN.textPrimary }}>
                        {item.user_id}
                      </Text>
                      <Text style={{ fontSize: 12, color: INTELLICONN.textSecondary }}>
                        {item.joined_at ? new Date(item.joined_at).toLocaleDateString() : 'Pending'}
                      </Text>
                    </View>
                  </View>

                  <Text style={{
                    backgroundColor: roleInfo.color,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: '600'
                  }}>
                    {roleInfo.name}
                  </Text>

                  {item.role !== 'owner' && (
                    <TouchableOpacity onPress={() => removeMember(item.id)}>
                      <Trash2 size={18} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        )}
      </View>

      {/* Invite Modal */}
      <Modal visible={showInviteModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 20,
            position: 'relative'
          }}>

            {/* X Button */}
            <TouchableOpacity
              onPress={() => setShowInviteModal(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#F1F5F9'
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: INTELLICONN.textSecondary }}>
                ✕
              </Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
              Invite Team Member
            </Text>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 12,
              paddingHorizontal: 19,
              marginBottom: 16
            }}>
              <Mail size={16} color="#6B7280" />
              <TextInput
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="colleague@example.com"
                style={{ flex: 1, height: 44, marginLeft: 8 }}
              />
            </View>

            <Text style={{ marginBottom: 6, fontWeight: '600' }}>Role Permissions</Text>
            <ScrollView style={{
              maxHeight: 180,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 12,
              marginBottom: 16
            }}>
              {roles.filter(role => role.id !== 'owner').map(role => (
                <TouchableOpacity
                  key={role.id}
                  onPress={() => setInviteRole(role.id)}
                  style={{
                    padding: 10,
                    backgroundColor: inviteRole === role.id ? '#E3F2FD' : '#fff'
                  }}
                >
                  <Text style={{ fontWeight: '600' }}>{role.name}</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>
                    {role.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={inviteMember}
              disabled={inviting || !inviteEmail.trim()}
              style={{
                backgroundColor: INTELLICONN.primary,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>
                {inviting ? 'Sending...' : 'Send Invitation'}
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
