/**
 * Simulation Components Index
 *
 * Central export point for all simulation-related components
 */

// FluentCalculations component
export { default as FluentCalculations } from './FluentCalculations';
export type { FluentCalculationsProps } from './FluentCalculations';
// Backwards-compatible alias for previous naming
export { default as FluentCalculationsContent } from './FluentCalculations';

// SolverSetup component
export { default as SolverSetup } from './SolverSetup';

// FluentSolutionVariables component
export { default as FluentSolutionVariables } from './FluentSolutionVariables';
export type { SolutionVariable } from './FluentSolutionVariables';
// Backwards-compatible alias for previous naming
export { default as FluentSolutionVariablesContent } from './FluentSolutionVariables';

// Results component
export { default as ResultsContent } from './Results';
export { Results } from './Results';
export type { ResultsProps } from './Results';

// SolvedCases component
export { default as SolvedCasesContent } from './SolvedCases';
export { SolvedCases } from './SolvedCases';
export type { SolvedCasesProps } from './SolvedCases';
