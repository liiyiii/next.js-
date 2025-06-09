// src/contexts/AlertContext.js
'use client';
import React, { createContext, useState, useContext, useCallback } from 'react';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = useCallback((message) => {
    setAlertMessage(message);
    setIsAlertOpen(true);
  }, []);

  const hideAlert = useCallback(() => {
    setIsAlertOpen(false);
    setAlertMessage(''); // Clear message on hide
  }, []);

  return (
    <AlertContext.Provider value={{ isAlertOpen, alertMessage, showAlert, hideAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
