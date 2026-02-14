"use client";

import React, { createContext, useContext } from 'react';

const ExamContext = createContext(null);

export function ExamProvider({ children, value }) {
  return (
    <ExamContext.Provider value={value}>
      {children}
    </ExamContext.Provider>
  );
}

export function useExam() {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
}
