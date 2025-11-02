import { createAction, props } from '@ngrx/store';

export const startScan = createAction('[Scan] Start', props<{ repoUrl: string }>());
export const updateProgress = createAction('[Scan] Update Progress', props<{ progress: number, currentStep: string }>());
export const completeScan = createAction('[Scan] Complete', props<{ results: any }>());
export const scanError = createAction('[Scan] Error', props<{ error: string }>());
export const resetScan = createAction('[Scan] Reset');
