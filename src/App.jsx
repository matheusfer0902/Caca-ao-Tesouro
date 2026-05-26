import { GameProvider, useGame } from '@/context/GameContext.jsx';
import { SetupScreen } from '@/components/screens/SetupScreen.jsx';
import { SimulationScreen } from '@/components/screens/SimulationScreen.jsx';
import { ErrorBoundary } from '@/components/ErrorBoundary.jsx';
import { APP_SCREENS } from '@/utils/constants.js';
import '@/styles/global.css';

function AppRouter() {
  const { state } = useGame();

  if (state.appScreen === APP_SCREENS.SETUP) {
    return <SetupScreen />;
  }

  return <SimulationScreen />;
}

export default function App() {
  return (
    <GameProvider>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </GameProvider>
  );
}
