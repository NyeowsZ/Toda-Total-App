export interface TallyEntry {
  bn: string;
  amount: number;
}

export type TerminalMode =
  | 'APPEND_STREAM'
  | 'INSPECT_EDIT'
  | 'INSERT_STREAM'
  | 'HISTORY_TAPE'
  | 'TOTALS_STEPPER';

export type CaptureStep = 'STEP_BN' | 'STEP_AMOUNT';

export interface SparseTotal {
  bn: string;
  total: number;
  count: number;
}

export interface TerminalState {
  entries: TallyEntry[];
  mode: TerminalMode;
  step: CaptureStep;
  cursorIndex: number;
  insertPointer: number;
  bnBuffer: string;
  amountBuffer: string;
  isDefaultAmount: boolean;
  totalsCursor: number;
  totalsPendingConfirm: boolean;
  confirmStepOnNext: boolean;
}
