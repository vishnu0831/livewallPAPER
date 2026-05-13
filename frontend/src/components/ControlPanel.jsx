import { useEffect } from 'react';

export default function ControlPanel({ 
  videoSrc, isPlaying, isMuted, loop, brightness, blur, 
  saturation = 100, contrast = 100, // New defaults
  playbackRate, isOnBattery, isOccluded, onUpdate 
}) {
  
  const handleSelectVideo = async () => {
    if (window.electronAPI) {
      const filePath = await window.electronAPI.selectVideo();
      if (filePath) {
        const url = `file:///${encodeURI(filePath.replace(/\\/g, '/')).replace(/#/g, '%23').replace(/\?/g, '%3F')}`;
        onUpdate({ videoSrc: url });
      }
    }
  };

  return (
    <div className="control-panel no-drag">
      <div className="panel-header">
        <h2 className="panel-title">LiveWall Pro</h2>
        <div className="status-badge on">Active</div>
      </div>

      <div className="section">
        <p className="section-label">Media Control</p>
        <button className="btn-primary" onClick={handleSelectVideo}>
          <span>📁</span> Select Wallpaper
        </button>
      </div>

      <div className="controls-row">
        <button 
          className={`icon-btn ${isPlaying ? 'active' : ''}`}
          onClick={() => onUpdate({ isPlaying: !isPlaying })}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button 
          className={`icon-btn ${!isMuted ? 'active' : ''}`}
          onClick={() => onUpdate({ isMuted: !isMuted })}
          title="Audio"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        <button 
          className={`icon-btn ${loop ? 'active' : ''}`}
          onClick={() => onUpdate({ loop: !loop })}
          title="Loop"
        >
          🔁
        </button>
        <button 
          className="icon-btn"
          style={{marginLeft: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}}
          onClick={() => window.electronAPI?.quitApp()}
          title="Exit App"
        >
          ✕
        </button>
      </div>

      <div className="section">
        <p className="section-label">Performance</p>
        <div className="slider-group">
          <div className="slider-info">
            <label>Playback Speed</label>
            <span className="value">{playbackRate.toFixed(1)}x</span>
          </div>
          <input 
            type="range" min="0.5" max="2" step="0.1" 
            value={playbackRate} 
            onChange={(e) => onUpdate({ playbackRate: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      <div className="section">
        <p className="section-label">Visual Filters</p>
        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
          <div className="slider-group">
            <div className="slider-info">
              <label>Brightness</label>
              <span className="value">{brightness}%</span>
            </div>
            <input 
              type="range" min="10" max="200" step="1" 
              value={brightness} 
              onChange={(e) => onUpdate({ brightness: parseInt(e.target.value) })}
            />
          </div>

          <div className="slider-group">
            <div className="slider-info">
              <label>Blur</label>
              <span className="value">{blur}px</span>
            </div>
            <input 
              type="range" min="0" max="20" step="1" 
              value={blur} 
              onChange={(e) => onUpdate({ blur: parseInt(e.target.value) })}
            />
          </div>

          <div className="slider-group">
            <div className="slider-info">
              <label>Saturation</label>
              <span className="value">{saturation}%</span>
            </div>
            <input 
              type="range" min="0" max="200" step="1" 
              value={saturation} 
              onChange={(e) => onUpdate({ saturation: parseInt(e.target.value) })}
            />
          </div>

          <div className="slider-group">
            <div className="slider-info">
              <label>Contrast</label>
              <span className="value">{contrast}%</span>
            </div>
            <input 
              type="range" min="50" max="150" step="1" 
              value={contrast} 
              onChange={(e) => onUpdate({ contrast: parseInt(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div className="panel-footer" style={{marginTop: 'auto', display: 'flex', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)'}}>
        <div className={`status-badge ${isOnBattery ? 'on' : ''}`} style={{background: isOnBattery ? 'rgba(234, 179, 8, 0.2)' : '', color: isOnBattery ? '#eab308' : ''}}>
          {isOnBattery ? '🔋 Battery Mode' : '🔌 AC Power'}
        </div>
        <div className={`status-badge ${isOccluded ? 'on' : ''}`}>
          {isOccluded ? '💤 Optimized (Paused)' : '🚀 Rendering'}
        </div>
      </div>
    </div>
  );
}
