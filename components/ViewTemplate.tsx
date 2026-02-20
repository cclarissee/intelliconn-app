import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { height } = Dimensions.get('window');

interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
  platform: string[];
  public: boolean;
  userId: string;
  createdAt: Date;
  isAdminTemplate?: boolean;
  creatorRole?: string;
  creatorName?: string;
}

interface ViewTemplateProps {
  visible: boolean;
  template: Template | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onHide: () => void;
  onUnhide: () => void;
  isAdmin: boolean;
  isHidden: boolean;
  isOwner?: boolean;
}

export default function ViewTemplate({
  visible,
  template,
  onClose,
  onEdit,
  onDelete,
  onHide,
  onUnhide,
  isAdmin,
  isHidden,
  isOwner = false,
}: ViewTemplateProps) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(height);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!template) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
          onPress={onClose} 
          activeOpacity={1}
        />
        
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{template.name}</Text>

            {/* Meta chips */}
            <View style={styles.chipsRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{template.category}</Text>
              </View>
              {template.platform.map((plat) => (
                <View key={plat} style={styles.chip}>
                  <Text style={styles.chipText}>{plat}</Text>
                </View>
              ))}
              {template.public && (
                <View style={[styles.chip, styles.publicChip]}>
                  <Text style={styles.publicText}>Public</Text>
                </View>
              )}
              {template.isAdminTemplate && (
                <View style={[styles.chip, styles.adminChip]}>
                  <Text style={styles.adminText}>Admin Template</Text>
                </View>
              )}
            </View>

            {/* Content */}
            <View style={styles.contentCard}>
              <Text style={styles.content}>{template.content}</Text>
            </View>

            {/* Date */}
            <Text style={styles.date}>
              Created on {template.createdAt instanceof Date ? template.createdAt.toLocaleDateString() : 'Unknown date'}
            </Text>

            {/* Creator Attribution */}
            {template.public && (
              <View style={styles.creatorBox}>
                <Text style={styles.creatorLabel}>Created by</Text>
                <Text style={styles.creatorName}>
                  {template.creatorRole === 'admin' ? '🔐 Admin' : '👤 Community'}
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              {/* Show Edit button only if user owns the template or is admin */}
              {(isOwner || isAdmin) && !template.isAdminTemplate && (
                <TouchableOpacity style={styles.primary} onPress={onEdit}>
                  <Text style={styles.primaryText}>Edit Template</Text>
                </TouchableOpacity>
              )}

              {/* Show info message for public templates from other users */}
              {!isOwner && template.public && !template.isAdminTemplate && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    ℹ️ This is a public template shared by the community. You can use it for posts.
                  </Text>
                </View>
              )}

              {/* Show info message for non-admin users viewing admin templates */}
              {!isAdmin && template.isAdminTemplate && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    ℹ️ This is an admin template. You can use it for posts but cannot edit or delete it.
                  </Text>
                </View>
              )}

              {/* Show Delete button only if user owns the template or is admin of non-admin template */}
              {(isOwner || isAdmin) && !template.isAdminTemplate && (
                <TouchableOpacity style={styles.danger} onPress={onDelete}>
                  <Text style={styles.dangerText}>Delete</Text>
                </TouchableOpacity>
              )}

              {/* Show Hide button for admin templates (non-admin users) */}
              {!isAdmin && template.isAdminTemplate && !isHidden && (
                <TouchableOpacity style={styles.warning} onPress={onHide}>
                  <Text style={styles.warningText}>Hide Template</Text>
                </TouchableOpacity>
              )}

              {/* Show Unhide button for hidden templates */}
              {!isAdmin && template.isAdminTemplate && isHidden && (
                <TouchableOpacity style={styles.success} onPress={onUnhide}>
                  <Text style={styles.successText}>Restore Template</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.secondary} onPress={onClose}>
                <Text style={styles.secondaryText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 16,
  },
  chipsRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  marginBottom: 20,
},

chip: {
  backgroundColor: '#F3F4F6',
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 999,
  marginHorizontal: 6,
  marginVertical: 6,
  minWidth: 90,
  alignItems: 'center',
},

  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  publicChip: {
    backgroundColor: '#E0E7FF',
  },
  publicText: {
    color: '#4338CA',
    fontWeight: '700',
    fontSize: 13,
  },
  adminChip: {
    backgroundColor: '#FEF3C7',
  },
  adminText: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 13,
  },
  contentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
  },
  date: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  creatorBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0284C7',
  },
  creatorLabel: {
    fontSize: 12,
    color: '#0C4A6E',
    fontWeight: '600',
    marginBottom: 4,
  },
  creatorName: {
    fontSize: 14,
    color: '#0369A1',
    fontWeight: '700',
  },
  actions: {
    gap: 10,
  },
  primary: {
    backgroundColor: '#6366F1',
    padding: 14,
    borderRadius: 14,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
  danger: {
    backgroundColor: '#FEE2E2',
    padding: 14,
    borderRadius: 14,
  },
  dangerText: {
    color: '#B91C1C',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 15,
  },
  warning: {
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 14,
  },
  warningText: {
    color: '#92400E',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 15,
  },
  success: {
    backgroundColor: '#D1FAE5',
    padding: 14,
    borderRadius: 14,
  },
  successText: {
    color: '#065F46',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 15,
  },
  infoBox: {
    backgroundColor: '#DBEAFE',
    padding: 14,
    borderRadius: 14,
  },
  infoText: {
    color: '#1E40AF',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  secondary: {
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 14,
  },
  secondaryText: {
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 15,
  },
});
