// === MAIN APPLICATION ===
// This file coordinates all modules and initializes the wind vector application

function initApp() {
  SceneManager.init();
  MapManager.init();
  WindGenerator.generateGrid();
  LabelsManager.create();
  UIManager.init();
  EventHandlers.init();
  
  // Initialize splitter for resizable panels
  Splitter.init();
  
  AnimationLoop.start();
}

// Initialize the application when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
} 