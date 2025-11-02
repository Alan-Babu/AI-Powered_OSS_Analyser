import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ScanState } from './scan.state';

export const selectScanState = createFeatureSelector<ScanState>('scan');

export const selectIsScanning = createSelector(selectScanState, (state) => state.isScanning);
export const selectProgress = createSelector(selectScanState, (state) => state.progress);
export const selectCurrentStep = createSelector(selectScanState, (state) => state.currentStep);
export const selectResults = createSelector(selectScanState, (state) => state.results);
export const selectError = createSelector(selectScanState, (state) => state.error);
