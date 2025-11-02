export interface ScanState {
  isScanning: boolean;
  progress: number;
  currentStep: string;
  results: any | null;
  error: string | null;
}

export const initialState: ScanState = {
  isScanning: false,
  progress: 0,
  currentStep: '',
  results: null,
  error: null
};