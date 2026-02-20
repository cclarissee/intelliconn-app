import { useTheme } from '@/contexts/ThemeContext';
import { AlertCircle, AlertTriangle, CheckCircle, Eye, EyeOff, Info, Send } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type AnnouncementType = 'info' | 'success' | 'warning' | 'critical';
type AnnouncementAudience = 'all' | 'admins' | 'beta';

export interface AnnouncementFormValues {
	title: string;
	message: string;
	type: AnnouncementType;
	audience: AnnouncementAudience;
	pinned: boolean;
	sendPush: boolean;
	expiresInDays?: number | null;
}

interface CreateAnnouncmentProps {
	initialValues?: Partial<AnnouncementFormValues>;
	onSubmit?: (values: AnnouncementFormValues) => void;
	onCancel?: () => void;
	isLoading?: boolean;
}

export default function CreateAnnouncment({
	initialValues,
	onSubmit,
	onCancel,
	isLoading = false,
}: CreateAnnouncmentProps) {
	const { theme } = useTheme();

	const [title, setTitle] = useState(initialValues?.title ?? '');
	const [message, setMessage] = useState(initialValues?.message ?? '');
	const [type, setType] = useState<AnnouncementType>(initialValues?.type ?? 'info');
	const [audience, setAudience] = useState<AnnouncementAudience>(initialValues?.audience ?? 'all');
	const [pinned, setPinned] = useState(initialValues?.pinned ?? false);
	const [sendPush, setSendPush] = useState(initialValues?.sendPush ?? true);
	const [expiresInDays, setExpiresInDays] = useState<string>(
		initialValues?.expiresInDays != null ? String(initialValues.expiresInDays) : ''
	);
	const [showPreview, setShowPreview] = useState(true);
	const [titleError, setTitleError] = useState('');
	const [messageError, setMessageError] = useState('');

	useEffect(() => {
		if (!initialValues) return;
		setTitle(initialValues.title ?? '');
		setMessage(initialValues.message ?? '');
		setType(initialValues.type ?? 'info');
		setAudience(initialValues.audience ?? 'all');
		setPinned(initialValues.pinned ?? false);
		setSendPush(initialValues.sendPush ?? true);
		setExpiresInDays(initialValues.expiresInDays != null ? String(initialValues.expiresInDays) : '');
	}, [initialValues]);

	const colors = theme === 'dark'
		? {
				background: '#0F172A',
				card: '#1E293B',
				text: '#F9FAFB',
				secondaryText: '#94A3B8',
				inputBg: '#0B1220',
				inputBorder: '#334155',
				border: '#334155',
				primary: '#3B82F6',
				danger: '#EF4444',
				muted: '#475569',
			}
		: {
				background: '#F8FAFC',
				card: '#FFFFFF',
				text: '#0F172A',
				secondaryText: '#64748B',
				inputBg: '#F1F5F9',
				inputBorder: '#E2E8F0',
				border: '#E2E8F0',
				primary: '#3B82F6',
				danger: '#EF4444',
				muted: '#CBD5F5',
			};

	const typeConfig = useMemo(() => ({
		info: { label: 'Info', color: '#3B82F6', light: '#DBEAFE', icon: Info },
		success: { label: 'Success', color: '#10B981', light: '#D1FAE5', icon: CheckCircle },
		warning: { label: 'Warning', color: '#F59E0B', light: '#FEF3C7', icon: AlertTriangle },
		critical: { label: 'Critical', color: '#EF4444', light: '#FEE2E2', icon: AlertCircle },
	}), []);

	const audienceOptions: { key: AnnouncementAudience; label: string }[] = [
		{ key: 'all', label: 'All users' },
		{ key: 'admins', label: 'Admins only' },
		{ key: 'beta', label: 'Beta group' },
	];

	const validate = () => {
		let valid = true;
		if (!title.trim()) {
			setTitleError('Title is required');
			valid = false;
		} else {
			setTitleError('');
		}
		if (!message.trim()) {
			setMessageError('Message is required');
			valid = false;
		} else {
			setMessageError('');
		}
		return valid;
	};

	const handleSubmit = () => {
		if (!validate()) return;
		const parsedDays = expiresInDays.trim() ? Number(expiresInDays) : null;
		onSubmit?.({
			title: title.trim(),
			message: message.trim(),
			type,
			audience,
			pinned,
			sendPush,
			expiresInDays: Number.isFinite(parsedDays) ? parsedDays : null,
		});
	};

	const TypeIcon = typeConfig[type].icon;

	return (
		<View style={[styles.screen, { backgroundColor: colors.background }]}>
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
				>
					<View style={styles.headerRow}>
						<View>
							<Text style={[styles.title, { color: colors.text }]}>Create announcement</Text>
							<Text style={[styles.subtitle, { color: colors.secondaryText }]}>Share updates with your community</Text>
						</View>
						<TouchableOpacity
							style={styles.previewToggle}
							onPress={() => setShowPreview(prev => !prev)}
							disabled={isLoading}
						>
							{showPreview ? (
								<EyeOff size={18} color={colors.secondaryText} />
							) : (
								<Eye size={18} color={colors.secondaryText} />
							)}
							<Text style={[styles.previewToggleText, { color: colors.secondaryText }]}
							>
								{showPreview ? 'Hide preview' : 'Show preview'}
							</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.section}>
						<Text style={[styles.label, { color: colors.text }]}>Announcement type</Text>
						<View style={styles.typeRow}>
							{(Object.keys(typeConfig) as AnnouncementType[]).map((key) => {
								const config = typeConfig[key];
								const isActive = type === key;
								return (
									<TouchableOpacity
										key={key}
										onPress={() => setType(key)}
										style={[
											styles.typePill,
											{
												backgroundColor: isActive ? config.light : colors.inputBg,
												borderColor: isActive ? config.color : colors.inputBorder,
											},
										]}
										disabled={isLoading}
									>
										<config.icon size={16} color={isActive ? config.color : colors.secondaryText} />
										<Text style={[styles.typeText, { color: isActive ? config.color : colors.secondaryText }]}
										>
											{config.label}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					</View>

					<View style={styles.section}>
						<Text style={[styles.label, { color: colors.text }]}>Title</Text>
						<TextInput
							style={[
								styles.input,
								{
									backgroundColor: colors.inputBg,
									borderColor: titleError ? colors.danger : colors.inputBorder,
									color: colors.text,
								},
							]}
							placeholder="e.g., Scheduled maintenance tonight"
							placeholderTextColor={colors.secondaryText}
							value={title}
							onChangeText={(text) => {
								setTitle(text);
								if (titleError) setTitleError('');
							}}
							maxLength={120}
							editable={!isLoading}
						/>
						{!!titleError && (
							<Text style={[styles.errorText, { color: colors.danger }]}>{titleError}</Text>
						)}
					</View>

					<View style={styles.section}>
						<Text style={[styles.label, { color: colors.text }]}>Message</Text>
						<TextInput
							style={[
								styles.textarea,
								{
									backgroundColor: colors.inputBg,
									borderColor: messageError ? colors.danger : colors.inputBorder,
									color: colors.text,
								},
							]}
							placeholder="Write the announcement details..."
							placeholderTextColor={colors.secondaryText}
							value={message}
							onChangeText={(text) => {
								setMessage(text);
								if (messageError) setMessageError('');
							}}
							multiline
							numberOfLines={6}
							textAlignVertical="top"
							editable={!isLoading}
						/>
						{!!messageError && (
							<Text style={[styles.errorText, { color: colors.danger }]}>{messageError}</Text>
						)}
					</View>

					<View style={styles.section}>
						<Text style={[styles.label, { color: colors.text }]}>Audience</Text>
						<View style={styles.audienceRow}>
							{audienceOptions.map(option => {
								const selected = audience === option.key;
								return (
									<TouchableOpacity
										key={option.key}
										style={[
											styles.audiencePill,
											{
												backgroundColor: selected ? colors.primary : colors.inputBg,
												borderColor: selected ? colors.primary : colors.inputBorder,
											},
										]}
										onPress={() => setAudience(option.key)}
										disabled={isLoading}
									>
										<Text style={[styles.audienceText, { color: selected ? '#fff' : colors.secondaryText }]}>
											{option.label}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					</View>

					<View style={styles.section}>
						<Text style={[styles.label, { color: colors.text }]}>Options</Text>
						<View style={[styles.toggleRow, { borderColor: colors.border }]}>
							<View>
								<Text style={[styles.toggleTitle, { color: colors.text }]}>Pin to top</Text>
								<Text style={[styles.toggleSubtitle, { color: colors.secondaryText }]}>Keep announcement visible</Text>
							</View>
							<Switch value={pinned} onValueChange={setPinned} disabled={isLoading} />
						</View>
						<View style={[styles.toggleRow, { borderColor: colors.border }]}
						>
							<View>
								<Text style={[styles.toggleTitle, { color: colors.text }]}>Send push</Text>
								<Text style={[styles.toggleSubtitle, { color: colors.secondaryText }]}>Notify users instantly</Text>
							</View>
							<Switch value={sendPush} onValueChange={setSendPush} disabled={isLoading} />
						</View>
					</View>

					<View style={styles.section}>
						<Text style={[styles.label, { color: colors.text }]}>Expires in days (optional)</Text>
						<TextInput
							style={[
								styles.input,
								{
									backgroundColor: colors.inputBg,
									borderColor: colors.inputBorder,
									color: colors.text,
								},
							]}
							keyboardType="number-pad"
							placeholder="e.g., 7"
							placeholderTextColor={colors.secondaryText}
							value={expiresInDays}
							onChangeText={setExpiresInDays}
							editable={!isLoading}
						/>
					</View>

					{showPreview && (
						<View style={styles.section}>
							<Text style={[styles.label, { color: colors.text }]}>Preview</Text>
							<View
								style={[
									styles.previewCard,
									{ borderColor: typeConfig[type].color, backgroundColor: colors.inputBg },
								]}
							>
								<View style={styles.previewHeader}>
									<View style={[styles.previewIcon, { backgroundColor: typeConfig[type].light }]}>
										<TypeIcon size={18} color={typeConfig[type].color} />
									</View>
									<Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={2}>
										{title || 'Announcement title'}
									</Text>
								</View>
								<Text style={[styles.previewMessage, { color: colors.secondaryText }]} numberOfLines={4}>
									{message || 'Announcement details will appear here.'}
								</Text>
								<View style={[styles.previewBadge, { backgroundColor: typeConfig[type].color }]}
								>
									<Text style={styles.previewBadgeText}>{typeConfig[type].label.toUpperCase()}</Text>
								</View>
							</View>
						</View>
					)}

					<View style={styles.footer}>
						<TouchableOpacity
							style={[styles.secondaryButton, { borderColor: colors.border }]}
							onPress={onCancel}
							disabled={isLoading}
						>
							<Text style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.primaryButton, { backgroundColor: colors.primary }]}
							onPress={handleSubmit}
							disabled={isLoading}
						>
							<Send size={18} color="#fff" />
							<Text style={styles.primaryButtonText}>Publish</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
	},
	content: {
		padding: 16,
	},
	card: {
		borderRadius: 16,
		borderWidth: 1,
		padding: 18,
		gap: 18,
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,
	},
	title: {
		fontSize: 22,
		fontWeight: '700',
	},
	subtitle: {
		fontSize: 14,
		marginTop: 4,
	},
	previewToggle: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	previewToggleText: {
		fontSize: 13,
		fontWeight: '600',
	},
	section: {
		gap: 10,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
	},
	typeRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
	},
	typePill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		borderWidth: 1,
	},
	typeText: {
		fontSize: 13,
		fontWeight: '600',
	},
	input: {
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 14,
	},
	textarea: {
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 12,
		fontSize: 14,
		minHeight: 120,
	},
	errorText: {
		fontSize: 12,
		marginTop: 4,
	},
	audienceRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
	},
	audiencePill: {
		borderRadius: 999,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderWidth: 1,
	},
	audienceText: {
		fontSize: 13,
		fontWeight: '600',
	},
	toggleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 10,
		borderBottomWidth: 1,
	},
	toggleTitle: {
		fontSize: 14,
		fontWeight: '600',
	},
	toggleSubtitle: {
		fontSize: 12,
		marginTop: 2,
	},
	previewCard: {
		borderRadius: 14,
		borderWidth: 1,
		padding: 14,
		gap: 10,
	},
	previewHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	previewIcon: {
		width: 32,
		height: 32,
		borderRadius: 999,
		alignItems: 'center',
		justifyContent: 'center',
	},
	previewTitle: {
		fontSize: 16,
		fontWeight: '700',
		flex: 1,
	},
	previewMessage: {
		fontSize: 13,
		lineHeight: 18,
	},
	previewBadge: {
		alignSelf: 'flex-start',
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	previewBadgeText: {
		color: '#fff',
		fontSize: 11,
		fontWeight: '700',
		letterSpacing: 0.4,
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
		marginTop: 4,
	},
	secondaryButton: {
		flex: 1,
		borderWidth: 1,
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: 'center',
	},
	secondaryButtonText: {
		fontSize: 14,
		fontWeight: '700',
	},
	primaryButton: {
		flex: 1,
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		gap: 8,
	},
	primaryButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '700',
	},
});
