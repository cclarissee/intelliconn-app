import React from 'react';
import { RefreshControl } from 'react-native';

import { Colors } from '../constants/theme';

type AppRefreshControlProps = {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  tintColor?: string;
  colors?: string[];
};

export default function AppRefreshControl({
  refreshing,
  onRefresh,
  tintColor,
  colors,
}: AppRefreshControlProps) {
  const resolvedTint = tintColor ?? Colors.light.tint;
  const resolvedColors = colors ?? [resolvedTint];

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={resolvedTint}
      colors={resolvedColors}
    />
  );
}
