import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: 50,
        borderBottomWidth: 1,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    backButton: {
        fontSize: 16,
        fontWeight: '600',
    },
    tabs: {
        borderBottomWidth: 1,
    },
    tabsContainer: {
        flexDirection: 'row',
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 8,
        minWidth: 120,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    tabContent: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    sectionSpacer: {
        marginTop: 24,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    userAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userAvatarText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    userDetails: {
        flex: 1,
    },
    userEmail: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    userEmailSubtext: {
        fontSize: 12,
        marginBottom: 4,
    },
    authMetaText: {
        fontSize: 12,
        marginTop: 2,
    },
    userMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    roleBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    userActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    postCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    postActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    viewPostButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
    },
    viewPostButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    deletePostButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    postMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    postAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    postAvatarText: {
        fontSize: 16,
        fontWeight: '700',
    },
    postAuthorInfo: {
        flex: 1,
    },
    postAuthorName: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    postMetaText: {
        fontSize: 12,
    },
    postContent: {
        fontSize: 14,
        lineHeight: 20,
    },
    filterGroup: {
        gap: 12,
        marginBottom: 16,
    },
    filterInput: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
    },
    filterRow: {
        gap: 8,
    },
    filterLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    filterChipRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    emptyState: {
        padding: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        marginTop: 12,
    },
    loadingText: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 100,
    },
    settingsCard: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    settingsHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    lockButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    lockButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    settingsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    settingsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    settingsDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    apiKeyInput: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        marginBottom: 16,
    },
    saveButton: {
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 12,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    passwordIconContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 20,
        borderWidth: 1,
    },
    passwordInput: {
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        width: '100%',
    },
    auditLogContainer: {
        marginTop: 12,
        marginBottom: 12,
    },
    auditLogItem: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderLeftWidth: 4,
    },
    auditLogHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    auditLogAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    auditLogActionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    auditLogTime: {
        fontSize: 11,
    },
    auditLogUser: {
        fontSize: 13,
        marginBottom: 2,
    },
    auditLogError: {
        fontSize: 11,
        marginTop: 4,
    },
    emptyAuditLog: {
        padding: 20,
        alignItems: 'center',
    },
    emptyAuditText: {
        fontSize: 14,
    },
    refreshLogButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    refreshLogButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    sectionDescription: {
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    requestCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    requestHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    requestIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    requestInfo: {
        flex: 1,
    },
    requestTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    requestTime: {
        fontSize: 12,
    },
    requestDetails: {
        marginBottom: 16,
    },
    requestRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    requestLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    requestValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    requestActions: {
        flexDirection: 'row',
        gap: 12,
    },
    requestButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    approveButton: {
        // Additional styles handled by backgroundColor in component
    },
    rejectButton: {
        // Additional styles handled by backgroundColor in component
    },
    requestButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    announcementHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    announcementCard: {
        borderWidth: 1,
        borderLeftWidth: 4,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    announcementTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    typeLabel: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    typeLabelText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    announcementTitle: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },
    announcementActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    announcementMessage: {
        fontSize: 14,
        lineHeight: 20,
        marginTop: 12,
        marginBottom: 8,
    },
    announcementFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    announcementDate: {
        fontSize: 12,
    },
    emptyStateSubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        maxWidth: 420,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalEmail: {
        fontSize: 12,
        marginBottom: 16,
        textAlign: 'center',
    },
    roleOption: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        flexDirection: 'row',
        gap: 8,
    },
    roleOptionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
    },
    settingLabel: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    closeButton: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default styles;
