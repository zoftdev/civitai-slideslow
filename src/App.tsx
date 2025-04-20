import React, { useState } from 'react';
import styled from 'styled-components';
import Slideshow from './components/Slideshow';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
`;

const SlideshowContainer = styled.div<{ isPanelVisible: boolean }>`
  flex: 1;
  overflow: hidden;
  position: relative;
  padding-right: ${props => props.isPanelVisible ? '250px' : '0'};
  transition: padding-right 0.3s ease;

  @media (max-width: 768px) {
    padding-right: 0;
  }
`;

function App() {
  const [isPanelVisible, setIsPanelVisible] = useState(true);

  const handlePanelVisibilityChange = (isVisible: boolean) => {
    setIsPanelVisible(isVisible);
  };

  return (
    <AppContainer>
      <SlideshowContainer isPanelVisible={isPanelVisible}>
        <Slideshow onPanelVisibilityChange={handlePanelVisibilityChange} />
      </SlideshowContainer>
    </AppContainer>
  );
}

export default App;
