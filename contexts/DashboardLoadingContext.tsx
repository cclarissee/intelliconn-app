import React, { createContext, useContext, useState } from 'react';

interface DashboardLoadingContextType {
  dashboardLoading: boolean;
  setDashboardLoading: (value: boolean) => void;
}

const DashboardLoadingContext = createContext<DashboardLoadingContextType | undefined>(undefined);

export const DashboardLoadingProvider = ({ children }: any) => {
  const [dashboardLoading, setDashboardLoading] = useState(true);

  return (
    <DashboardLoadingContext.Provider value={{ dashboardLoading, setDashboardLoading }}>
      {children}
    </DashboardLoadingContext.Provider>
  );
};

export const useDashboardLoading = () => {
  const context = useContext(DashboardLoadingContext);
  if (!context) {
    throw new Error('useDashboardLoading must be used inside DashboardLoadingProvider');
  }
  return context;
};
