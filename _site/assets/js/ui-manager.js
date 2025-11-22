// === UI MANAGEMENT ===
const UIManager = {
  init() {
    this.setupGUI();
    this.createTooltip();
    TimeControls.updateDisplay();
  },

  createTooltip() {
    AppState.tooltip = document.createElement('div');
    AppState.tooltip.id = 'tooltip';
    document.body.appendChild(AppState.tooltip);
  },

  showTooltip(cube, clientX, clientY) {
    const stateData = getStateData(Config.settings.state);
    const bounds = stateData.bounds;
    const normalizedX = Utils.normalizeGridPosition(cube.position.x);
    const normalizedZ = Utils.normalizeGridPosition(cube.position.z);
    
    const lat = bounds[0][0] + (bounds[1][0] - bounds[0][0]) * (1 - normalizedZ);
    const lon = bounds[0][1] + (bounds[1][1] - bounds[0][1]) * normalizedX;
    
    const windDir = cube.userData.windDirection;
    const windAngle = Math.atan2(windDir.z, windDir.x) * 180 / Math.PI;
    const windDirection = ((windAngle + 360) % 360).toFixed(0);
    
    const latStr = Math.abs(lat).toFixed(2) + '°' + (lat >= 0 ? 'N' : 'S');
    const lonStr = Math.abs(lon).toFixed(2) + '°' + (lon >= 0 ? 'E' : 'W');
    
    AppState.tooltip.innerHTML = `FL${String(cube.userData.flightLevel).padStart(3, '0')}<br/>Wind: ${cube.userData.speed} kt @ ${windDirection}°<br/>${latStr} ${lonStr}`;
    AppState.tooltip.className = 'visible';
    AppState.tooltip.style.left = (clientX + 10) + 'px';
    AppState.tooltip.style.top = (clientY - 10) + 'px';
  },

  hideTooltip() {
    AppState.tooltip.className = '';
  },

  setupGUI() {
    // Populate state dropdown
    const stateSelect = document.getElementById('gui-state');
    Object.keys(StateCoordinates).forEach(stateName => {
      const option = document.createElement('option');
      option.value = stateName;
      option.textContent = stateName;
      if (stateName === Config.settings.state) {
        option.selected = true;
      }
      stateSelect.appendChild(option);
    });

    // State selector
    stateSelect.addEventListener('change', (e) => {
      StateManager.updateState(e.target.value);
    });

    // Map style selector
    const mapStyleSelect = document.getElementById('gui-map-style');
    mapStyleSelect.value = Config.settings.mapStyle;
    mapStyleSelect.addEventListener('change', (e) => {
      Config.settings.mapStyle = e.target.value;
      MapManager.updateStyle(e.target.value);
    });

    // Dark background checkbox
    const darkBgCheckbox = document.getElementById('gui-dark-background');
    darkBgCheckbox.checked = Config.settings.darkBackground;
    darkBgCheckbox.addEventListener('change', (e) => {
      Config.settings.darkBackground = e.target.checked;
      SceneManager.updateBackgroundColor(e.target.checked);
    });

    // Wind arrows checkbox
    const windArrowsCheckbox = document.getElementById('gui-wind-arrows');
    windArrowsCheckbox.checked = Config.settings.showWindArrows;
    windArrowsCheckbox.addEventListener('change', (e) => {
      Config.settings.showWindArrows = e.target.checked;
      SelectionManager.toggleWindArrows(e.target.checked);
    });

    // Cube opacity slider
    const cubeOpacitySlider = document.getElementById('gui-cube-opacity');
    const cubeOpacityValue = document.getElementById('gui-cube-opacity-value');
    cubeOpacitySlider.value = Config.settings.cubeOpacity;
    cubeOpacityValue.textContent = Config.settings.cubeOpacity.toFixed(2);
    cubeOpacitySlider.addEventListener('input', (e) => {
      Config.settings.cubeOpacity = parseFloat(e.target.value);
      cubeOpacityValue.textContent = Config.settings.cubeOpacity.toFixed(2);
      this.updateCubeOpacity();
    });

    // Thunderstorm checkbox
    const thunderstormCheckbox = document.getElementById('gui-thunderstorm');
    thunderstormCheckbox.checked = Config.settings.thunderstormActive;
    thunderstormCheckbox.addEventListener('change', (e) => {
      Config.settings.thunderstormActive = e.target.checked;
      this.onStormToggle('thunderstorm', e.target.checked);
    });

    // Hurricane checkbox
    const hurricaneCheckbox = document.getElementById('gui-hurricane');
    hurricaneCheckbox.checked = Config.settings.hurricaneActive;
    hurricaneCheckbox.addEventListener('change', (e) => {
      Config.settings.hurricaneActive = e.target.checked;
      this.onStormToggle('hurricane', e.target.checked);
    });

    // Hurricane intensity slider
    const hurricaneIntensitySlider = document.getElementById('gui-hurricane-intensity');
    const hurricaneIntensityValue = document.getElementById('gui-hurricane-intensity-value');
    hurricaneIntensitySlider.value = Config.settings.hurricaneIntensity;
    hurricaneIntensityValue.textContent = Config.settings.hurricaneIntensity;
    hurricaneIntensitySlider.addEventListener('input', (e) => {
      Config.settings.hurricaneIntensity = parseInt(e.target.value);
      hurricaneIntensityValue.textContent = Config.settings.hurricaneIntensity;
      this.onHurricaneIntensityChange();
    });

    // Randomize wind button
    const randomizeButton = document.getElementById('gui-randomize-wind');
    randomizeButton.addEventListener('click', () => {
      this.randomizeWind();
    });

    // Date and time controls
    TimeControls.setupControls();
  },

  onStormToggle(stormType, value) {
    const positionKey = stormType === 'hurricane' ? 'hurricanePosition' : 'thunderstormPosition';
    if (value) {
      Config.settings[positionKey] = Utils.getRandomPosition();
    }
    WindGenerator.regenerate();
  },

  onHurricaneIntensityChange() {
    if (Config.settings.hurricaneActive) {
      WindGenerator.regenerate();
    }
  },

  randomizeWind() {
    if (Config.settings.thunderstormActive) {
      Config.settings.thunderstormPosition = Utils.getRandomPosition();
    }
    
    if (Config.settings.hurricaneActive) {
      Config.settings.hurricanePosition = Utils.getRandomPosition();
    }
    
    const randomHourOffset = Math.floor(Math.random() * 24);
    const randomDayOffset = Math.floor(Math.random() * 30);
    
    const originalTime = { ...AppState.currentTime };
    const originalDate = new Date(AppState.currentDate);
    
    AppState.currentTime.hour = (AppState.currentTime.hour + randomHourOffset) % 24;
    AppState.currentDate.setDate(AppState.currentDate.getDate() + randomDayOffset);
    
    WindGenerator.regenerate();
    
    AppState.currentTime = originalTime;
    AppState.currentDate = originalDate;
    TimeControls.updateDisplay();
  },

  updateCubeOpacity() {
    if (!AppState.isHovering && AppState.selectedFlightLevel === null) {
      AppState.windCubes.forEach(cube => {
        cube.material.opacity = Config.settings.cubeOpacity;
      });
    } else if (AppState.selectedFlightLevel !== null) {
      AppState.windCubes.forEach(cube => {
        if (cube.userData.yLevel !== AppState.selectedFlightLevel) {
          cube.material.opacity = Config.settings.cubeOpacity;
        }
      });
    }
  }
};

// === TIME CONTROLS ===
const TimeControls = {
  setupControls() {
    // Date controls
    document.getElementById('gui-date-prev').addEventListener('click', () => {
      this.changeDate(-1);
    });
    
    document.getElementById('gui-date-next').addEventListener('click', () => {
      this.changeDate(1);
    });

    // Time controls
    document.getElementById('gui-time-prev').addEventListener('click', () => {
      this.changeTime(-1);
    });
    
    document.getElementById('gui-time-next').addEventListener('click', () => {
      this.changeTime(1);
    });

    // Initial display
    this.updateDisplay();
  },

  updateDisplay() {
    const dateValue = document.getElementById('gui-date-value');
    const timeValue = document.getElementById('gui-time-value');
    
    if (dateValue) {
      dateValue.textContent = Utils.formatDate(AppState.currentDate);
    }
    
    if (timeValue) {
      timeValue.textContent = Utils.formatTime(AppState.currentTime);
    }
  },

  changeDate(days) {
    const newDate = new Date(AppState.currentDate);
    newDate.setDate(newDate.getDate() + days);
    AppState.currentDate = newDate;
    this.updateDisplay();
    WindGenerator.regenerate();
  },

  changeTime(hours) {
    AppState.currentTime.hour += hours;
    
    if (AppState.currentTime.hour >= 24) {
      AppState.currentTime.hour = 0;
      this.changeDate(1);
      return;
    } else if (AppState.currentTime.hour < 0) {
      AppState.currentTime.hour = 23;
      this.changeDate(-1);
      return;
    }
    
    this.updateDisplay();
    WindGenerator.regenerate();
  }
}; 

// === STATE MANAGEMENT ===
const StateManager = {
  updateState(stateName) {
    Config.settings.state = stateName;
    const stateData = getStateData(stateName);
    if (!stateData) return;
    
    MapManager.updateState(stateData);
    WindGenerator.regenerate();
  }
}; 