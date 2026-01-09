import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar } from 'react-native-paper';
import { Text, StyleSheet } from 'react-native';
import StreakCelebrationModal from '@/components/StreakCelebrationModal';

interface StreakSnackbarContextType {
  showStreakExtended: (days: number) => void;
}

const StreakSnackbarContext = createContext<StreakSnackbarContextType | undefined>(undefined);

export function StreakSnackbarProvider({ children }: { children: React.ReactNode }) {
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [streakCount, setStreakCount] = useState(0);

  const showStreakExtended = useCallback((days: number) => {
    setStreakCount(days);
    setMessage(`🔥 ¡Racha extendida! ${days} ${days === 1 ? 'día' : 'días'}`);
    
    // Mostrar modal de celebración
    setModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    // Mostrar snackbar después de cerrar el modal
    setTimeout(() => {
      setSnackbarVisible(true);
    }, 300);
  }, []);

  return (
    <StreakSnackbarContext.Provider value={{ showStreakExtended }}>
      {children}
      
      {/* Modal de celebración */}
      <StreakCelebrationModal
        visible={modalVisible}
        streakCount={streakCount}
        onClose={handleModalClose}
      />
      
      {/* Snackbar que aparece después del modal */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
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
