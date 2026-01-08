import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar } from 'react-native-paper';
import { Text, StyleSheet } from 'react-native';

interface StreakSnackbarContextType {
  showStreakExtended: (days: number) => void;
}

const StreakSnackbarContext = createContext<StreakSnackbarContextType | undefined>(undefined);

export function StreakSnackbarProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const showStreakExtended = useCallback((days: number) => {
    setMessage(`🔥 ¡Racha extendida! ${days} ${days === 1 ? 'día' : 'días'}`);
    setVisible(true);
  }, []);

  return (
    <StreakSnackbarContext.Provider value={{ showStreakExtended }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        <Text style={styles.snackbarText}>{message}</Text>
      </Snackbar>
    </StreakSnackbarContext.Provider>
  );
}

export function useStreakSnackbar() {
  const context = useContext(StreakSnackbarContext);
  if (!context) {
    throw new Error('useStreakSnackbar must be used within StreakSnackbarProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  snackbar: {
    backgroundColor: '#7C3AED',
    marginBottom: 16,
    borderRadius: 12,
    elevation: 8,
  },
  snackbarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
