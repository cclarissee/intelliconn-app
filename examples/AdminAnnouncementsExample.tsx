/* 
 * Example: How to integrate AnnouncementModal in your admin panel
 * 
 * This file shows how to use the AnnouncementModal component
 * to create and manage announcements.
 */

import AnnouncementDisplay from '@/components/AnnouncementDisplay';
import AnnouncementModal from '@/components/AnnouncementModal';
import { Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AdminAnnouncementsExample() {
  const [modalVisible, setModalVisible] = useState(false);
  const [displayVisible, setDisplayVisible] = useState(false);

  const handleAnnouncementCreated = () => {
    // Refresh announcements list or show success message
    console.log('Announcement created successfully!');
    // You can add any additional logic here
  };

  return (
    <View style={styles.container}>
      {/* Button to create new announcement */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setModalVisible(true)}
      >
        <Plus size={20} color="#fff" />
        <Text style={styles.buttonText}>Create Announcement</Text>
      </TouchableOpacity>

      {/* Button to view all announcements */}
      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => setDisplayVisible(true)}
      >
        <Text style={styles.viewButtonText}>View All Announcements</Text>
      </TouchableOpacity>

      {/* Create/Edit Announcement Modal */}
      <AnnouncementModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={handleAnnouncementCreated}
        // For editing, pass the announcement object and set isEditing to true:
        // announcement={selectedAnnouncement}
        // isEditing={true}
      />

      {/* Display Announcements Modal */}
      <AnnouncementDisplay
        visible={displayVisible}
        onClose={() => setDisplayVisible(false)}
        onCreateNew={() => setModalVisible(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  viewButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

/* 
 * Usage Examples:
 * 
 * 1. Create New Announcement:
 * -------------------------
 * <AnnouncementModal
 *   visible={true}
 *   onClose={() => setModalVisible(false)}
 *   onSuccess={() => console.log('Created!')}
 * />
 * 
 * 2. Edit Existing Announcement:
 * -----------------------------
 * <AnnouncementModal
 *   visible={true}
 *   onClose={() => setModalVisible(false)}
 *   onSuccess={() => console.log('Updated!')}
 *   announcement={{
 *     id: '123',
 *     title: 'System Update',
 *     message: 'We are updating the system...',
 *     type: 'info',
 *     createdAt: new Date(),
 *     updatedAt: new Date()
 *   }}
 *   isEditing={true}
 * />
 * 
 * 3. With Custom Success Handler:
 * ------------------------------
 * const handleSuccess = async () => {
 *   // Refresh data
 *   await fetchAnnouncements();
 *   // Show toast
 *   showToast('Announcement saved!');
 *   // Close modal
 *   setModalVisible(false);
 * };
 * 
 * <AnnouncementModal
 *   visible={modalVisible}
 *   onClose={() => setModalVisible(false)}
 *   onSuccess={handleSuccess}
 * />
 */
