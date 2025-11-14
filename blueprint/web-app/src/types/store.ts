import {
  SimulationData,
  FluidModel,
  BottleDesign,
  OmniverseRenderState,
} from './index';

export interface AppState {
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
}

export interface SimulationState {
  currentSimulation: SimulationData | null;
  simulations: SimulationData[];
  selectedFluidModel: FluidModel | null;
  selectedBottleDesign: BottleDesign | null;
  isRunning: boolean;
}

export interface UIState {
  activeTab: 'simulation' | 'design' | 'results' | 'settings';
  omniverseViewport: OmniverseRenderState;
}

export type RootState = {
  app: AppState;
  simulation: SimulationState;
  ui: UIState;
};
