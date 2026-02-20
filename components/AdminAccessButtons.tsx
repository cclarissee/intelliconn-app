import { router } from 'expo-router';
import { Lock, Shield, Zap } from 'lucide-react-native';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface AdminAccessButtonsProps {
    isAdmin: boolean;
    isSuperAdmin: boolean;
    colors: any;
}

export default function AdminAccessButtons({
    isAdmin,
    isSuperAdmin,
    colors,
}: AdminAccessButtonsProps) {
    if (!isAdmin && !isSuperAdmin) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <Lock size={16} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Admin Tools
                </Text>
            </View>

            {/* Admin Panel Button */}
            {isAdmin && !isSuperAdmin && (
                <TouchableOpacity
                    style={[
                        styles.accessButton,
                        styles.adminButton,
                        {
                            backgroundColor: colors.accent,
                            shadowColor: colors.shadowColor,
                            shadowOpacity: colors.shadowOpacity,
                            shadowRadius: colors.shadowRadius,
                        },
                    ]}
                    onPress={() => router.push('/faculty-admin')}
                    activeOpacity={0.8}
                >
                    <View style={styles.buttonIconContainer}>
                        <Shield size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={[styles.buttonLabel, { color: '#FFFFFF' }]}>
                            Admin Panel
                        </Text>
                        <Text style={[styles.buttonSubtitle, { color: 'rgba(255,255,255,0.85)' }]}>
                            Manage users, posts & announcements
                        </Text>
                    </View>
                    <View style={styles.arrowIcon}>
                        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>→</Text>
                    </View>
                </TouchableOpacity>
            )}

            {/* Super Admin Panel Button */}
            {isSuperAdmin && (
                <TouchableOpacity
                    style={[
                        styles.accessButton,
                        styles.superAdminButton,
                        {
                            backgroundColor: colors.accent,
                            shadowColor: colors.shadowColor,
                            shadowOpacity: colors.shadowOpacity,
                            shadowRadius: colors.shadowRadius,
                        },
                    ]}
                    onPress={() => router.push('/faculty-admin')}
                    activeOpacity={0.8}
                >
                    <View style={styles.buttonIconContainer}>
                        <Zap size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={[styles.buttonLabel, { color: '#FFFFFF' }]}>
                            Super Admin Panel
                        </Text>
                        <Text style={[styles.buttonSubtitle, { color: 'rgba(255,255,255,0.85)' }]}>
                            Full system control & analytics
                        </Text>
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },

    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    accessButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 12,
        elevation: 4,
        shadowOffset: { width: 0, height: 2 },
        marginBottom: 10,
    },

    adminButton: {
        borderRadius: 14,
    },

    superAdminButton: {
        borderRadius: 14,
    },

    buttonIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },

    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },

    buttonLabel: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 3,
    },

    buttonSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        opacity: 0.85,
    },

    arrowIcon: {
        marginLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },

    badge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        marginLeft: 8,
    },

    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
});

