import { createReducer, on } from '@ngrx/store';
import { startScan, updateProgress, completeScan, scanError } from './scan.actions';
import { ScanState, initialState } from './scan.state';

export const scanReducer = createReducer(
  initialState,

  on(startScan, state => ({
    ...state,
    isScanning: true,
    progress: 0,
    currentStep: 'Initializing…',
    results: null,
    error: null
  })),

  on(updateProgress, (state, { progress, currentStep }) => ({
    ...state,
    progress,
    currentStep
  })),

  on(completeScan, (state, { results }) => ({
    ...state,
    isScanning: false,
    progress: 100,
    currentStep: 'Scan completed successfully!',
    results // ✅ keep entire RiskReport
  })),

  on(scanError, (state, { error }) => ({
    ...state,
    isScanning: false,
    progress: 0,
    currentStep: 'Scan failed',
    error
  }))
);
