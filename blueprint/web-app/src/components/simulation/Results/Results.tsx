/**
 * Results Component - Results & Visualization tab content
 * Refactored from common/ResultsVisualizationForm to reduce unnecessary layers
 */

import { Component } from 'react';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';
import './Results.css';

export interface ResultsProps {
  width?: number;
  enabled?: boolean;
  showStoreButton?: boolean;
  timestep?: number;
  isFullscreen?: boolean;
  isPathtracing?: boolean;
  isPlaying?: boolean;
  palettes?: string[];
  selectedPalette?: string;
  cameras?: string[];
  selectedCamera?: string;
  onStepCompleted?: () => void;
  onCameraChange?: (caseValue: string) => void;
  onPaletteChange?: (paletteValue: string) => void;
  onTimestepChange?: (timestep: number) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onRendererChange?: (isPathtracing: boolean) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

interface ResultsState {
  timestep: number;
  isFullscreen: boolean;
  isPathtracing: boolean;
  isPlaying: boolean;
  selectedCamera: string;
  selectedPalette: string;
  animationInterval: NodeJS.Timeout | null;
}

export default class Results extends Component<ResultsProps, ResultsState> {
  constructor(props: ResultsProps) {
    super(props);

    const cameras = props.cameras || [
      'Free',
      'Top',
      'Perspective',
      'Bottle',
      'Machinery',
    ];
    const palettes = props.palettes || [
      'Default',
      'blues',
      'coolwarm',
      'cubehelix',
      'cubelix_blue',
      'icefire',
      'light_blue',
      'mako',
      'rocket',
      'spectral',
      'vlag',
    ];

    this.state = {
      timestep: props.timestep || 0,
      isFullscreen: props.isFullscreen || false,
      isPathtracing: props.isPathtracing || false,
      isPlaying: props.isPlaying || false,
      selectedCamera: props.selectedCamera || cameras[0],
      selectedPalette: props.selectedPalette || palettes[0],
      animationInterval: null,
    };
  }

  componentWillUnmount() {
    if (this.state.animationInterval) {
      try {
        clearInterval(this.state.animationInterval);
      } catch (error) {
        console.warn('Failed to clear animation interval:', error);
      }
    }
  }

  handleTimestepChange = (newTimestep: number) => {
    this.setState({ timestep: newTimestep });
    this.props.onTimestepChange?.(newTimestep);

    try {
      const timestepMessage = {
        event_type: 'timestepChanged',
        payload: { timestep: newTimestep },
      };
      AppStreamer.sendMessage(JSON.stringify(timestepMessage));
    } catch (error) {
      console.warn('Failed to send timestep message:', error);
    }
  };

  handleControlPanelChange = (checked: boolean) => {
    this.setState({ isFullscreen: checked });
    this.props.onFullscreenChange?.(checked);

    try {
      const controlPanelMessage = {
        event_type: 'toggleFullscreen',
        payload: {},
      };
      AppStreamer.sendMessage(JSON.stringify(controlPanelMessage));
    } catch (error) {
      console.warn('Failed to send control panel toggle message:', error);
    }
  };

  handleRendererChange = (checked: boolean) => {
    this.setState({ isPathtracing: checked });
    this.props.onRendererChange?.(checked);

    try {
      const rendererMessage = {
        event_type: 'toggleRenderer',
        payload: { pathTracing: checked },
      };
      AppStreamer.sendMessage(JSON.stringify(rendererMessage));
    } catch (error) {
      console.warn('Failed to send renderer message:', error);
    }
  };

  startAnimation = () => {
    if (this.state.isPlaying) return;

    const interval = setInterval(() => {
      const next = this.state.timestep < 2530 ? this.state.timestep + 1 : 0;
      this.handleTimestepChange(next);
    }, 100);

    this.setState({ animationInterval: interval, isPlaying: true });
    this.props.onPlayStateChange?.(true);
  };

  stopAnimation = () => {
    if (this.state.animationInterval) {
      try {
        clearInterval(this.state.animationInterval);
      } catch (error) {
        console.warn('Failed to clear animation interval:', error);
      }
      this.setState({ animationInterval: null });
    }
    this.setState({ isPlaying: false });
    this.props.onPlayStateChange?.(false);
  };

  handleCameraChange = (cameraValue: string) => {
    this.setState({ selectedCamera: cameraValue });
    this.props.onCameraChange?.(cameraValue);

    try {
      const changeCameraMessage = {
        event_type: 'changeCamera',
        payload: { camerapath: cameraValue },
      };
      AppStreamer.sendMessage(JSON.stringify(changeCameraMessage));
    } catch (error) {
      console.warn('Failed to send camera change message:', error);
    }
  };

  handlePaletteChange = (paletteValue: string) => {
    this.setState({ selectedPalette: paletteValue });
    this.props.onPaletteChange?.(paletteValue);

    try {
      const changePaletteMessage = {
        event_type: 'setColorPalette',
        payload: { colorPalette: paletteValue },
      };
      AppStreamer.sendMessage(JSON.stringify(changePaletteMessage));
    } catch (error) {
      console.warn('Failed to send palette change message:', error);
    }
  };

  handleStore = () => {
    try {
      const message = {
        event_type: 'storeSolvedCase',
        payload: { case_name: 'Default' },
      };
      AppStreamer.sendMessage(JSON.stringify(message));
    } catch (error) {
      console.warn('Failed to send store message:', error);
    }
  };

  render() {
    const {
      enabled = true,
      width,
      showStoreButton = false,
      cameras = ['Free', 'Top', 'Perspective', 'Bottle', 'Machinery'],
      palettes = [
        'Default',
        'blues',
        'coolwarm',
        'cubehelix',
        'cubelix_blue',
        'icefire',
        'light_blue',
        'mako',
        'rocket',
        'spectral',
        'vlag',
      ],
    } = this.props;

    const {
      timestep,
      isFullscreen,
      isPathtracing,
      isPlaying,
      selectedCamera,
      selectedPalette,
    } = this.state;

    return (
      <div
        className={`results ${!enabled ? 'results--disabled' : ''}`}
        style={{ width: width ? `${width}px` : '100%' }}
      >
        <div className='results__header'>
          <h3 className='results__title'>Results & Visualization</h3>
          <p className='results__description'>
            Control timesteps and visualization settings for simulation results
          </p>
        </div>

        <div className='results__content'>
          {/* Camera Selection */}
          <div className='results__field'>
            <label className='results__label' htmlFor='camera-select'>
              Select Camera:
            </label>
            <select
              id='camera-select'
              className='results__select'
              value={selectedCamera}
              onChange={e => this.handleCameraChange(e.target.value)}
              disabled={!enabled}
            >
              {cameras.map((camera, index) => (
                <option key={index} value={camera}>
                  {camera}
                </option>
              ))}
            </select>
          </div>

          {/* Color Palette Selection */}
          <div className='results__field'>
            <label className='results__label' htmlFor='palette-select'>
              Color Palette:
            </label>
            <select
              id='palette-select'
              className='results__select'
              value={selectedPalette}
              onChange={e => this.handlePaletteChange(e.target.value)}
              disabled={!enabled}
            >
              {palettes.map((palette, index) => (
                <option key={index} value={palette}>
                  {palette}
                </option>
              ))}
            </select>
          </div>

          {/* Timestep Slider */}
          <div className='results__field'>
            <label className='results__label' htmlFor='timestep-slider'>
              Timestep: {timestep}
            </label>
            <input
              type='range'
              id='timestep-slider'
              className='results__slider'
              min='0'
              max='2530'
              value={timestep}
              onChange={e =>
                this.handleTimestepChange(parseInt(e.target.value))
              }
              disabled={!enabled}
            />
          </div>

          {/* Action Buttons - Play/Stop and Store Current (aligned horizontally) */}
          <div className='results__actions'>
            <button
              className='results__button results__button--primary'
              onClick={() => {
                if (isPlaying) {
                  this.stopAnimation();
                } else {
                  this.startAnimation();
                }
              }}
              disabled={!enabled}
            >
              {isPlaying ? 'Stop' : 'Play'}
            </button>

            {showStoreButton && (
              <button
                className='results__button results__button--primary'
                onClick={this.handleStore}
                disabled={!enabled}
              >
                Store Current
              </button>
            )}
          </div>

          {/* Path-Tracing Checkbox */}
          <div className='results__field'>
            <label className='results__checkbox-label'>
              <input
                type='checkbox'
                className='results__checkbox'
                checked={isPathtracing}
                onChange={e => this.handleRendererChange(e.target.checked)}
                disabled={!enabled}
              />
              <span className='results__checkbox-text'>Path-Tracing</span>
            </label>
          </div>

          {/* Show Control Panel Checkbox */}
          <div className='results__field'>
            <label className='results__checkbox-label'>
              <input
                type='checkbox'
                className='results__checkbox'
                checked={isFullscreen}
                onChange={e => this.handleControlPanelChange(e.target.checked)}
                disabled={!enabled}
              />
              <span className='results__checkbox-text'>Show control panel</span>
            </label>
          </div>
        </div>
      </div>
    );
  }
}
