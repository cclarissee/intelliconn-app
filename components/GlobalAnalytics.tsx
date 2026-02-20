import {
    getGlobalAnalytics,
    getTopPerformingPosts,
    getUsersAnalyticsSummary,
    GlobalAnalytics,
    UserAnalyticsSummary,
    UserPostAnalytic,
} from '@/lib/superAdminAnalyticsApi';
import { useCallback, useEffect, useState } from 'react';

export interface UseGlobalAnalyticsOptions {
	isVisible?: boolean;
	topPostsLimit?: number;
}

export interface GlobalAnalyticsResult {
	globalAnalytics: GlobalAnalytics | null;
	usersSummary: UserAnalyticsSummary[];
	topPosts: UserPostAnalytic[];
	lastUpdated: Date | null;
	loading: boolean;
	refreshing: boolean;
	error: unknown;
	loadAnalytics: () => Promise<boolean>;
	refreshAnalytics: () => Promise<boolean>;
}

export function useGlobalAnalytics(
	options: UseGlobalAnalyticsOptions = {}
): GlobalAnalyticsResult {
	const { isVisible = true, topPostsLimit = 15 } = options;
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<unknown>(null);

	const [globalAnalytics, setGlobalAnalytics] = useState<GlobalAnalytics | null>(null);
	const [usersSummary, setUsersSummary] = useState<UserAnalyticsSummary[]>([]);
	const [topPosts, setTopPosts] = useState<UserPostAnalytic[]>([]);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

	const loadAnalytics = useCallback(async (): Promise<boolean> => {
		if (!isVisible) return false;

		try {
			setLoading(true);
			setError(null);

			const [global, users, posts] = await Promise.all([
				getGlobalAnalytics(),
				getUsersAnalyticsSummary(),
				getTopPerformingPosts(topPostsLimit),
			]);

			setGlobalAnalytics(global);
			setUsersSummary(users);
			setTopPosts(posts);
			setLastUpdated(new Date());

			return true;
		} catch (err) {
			setError(err);
			return false;
		} finally {
			setLoading(false);
		}
	}, [isVisible, topPostsLimit]);

	const refreshAnalytics = useCallback(async (): Promise<boolean> => {
		if (refreshing) return false;

		try {
			setRefreshing(true);
			return await loadAnalytics();
		} finally {
			setRefreshing(false);
		}
	}, [refreshing, loadAnalytics]);

	useEffect(() => {
		void loadAnalytics();
	}, [loadAnalytics]);

	return {
		globalAnalytics,
		usersSummary,
		topPosts,
		lastUpdated,
		loading,
		refreshing,
		error,
		loadAnalytics,
		refreshAnalytics,
	};
}
