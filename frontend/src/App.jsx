import { useState, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import ControlPanel from './components/ControlPanel';

function App() {
  const [params, setParams] = useState(new URLSearchParams(window.location.search));
  const mode = params.get('mode') || 'wallpaper';

  // State shared via IPC
  const [videoSrc, setVideoSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [loop, setLoop] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [blur, setBlur] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isOnBattery, setIsOnBattery] = useState(false);
  const [isOccluded, setIsOccluded] = useState(false);

  useEffect(() => {
    // Aggressively prevent default drag and drop behavior for the whole document in the capture phase
    const preventDefault = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    const handleGlobalDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file && file.path) {
          const lowerPath = file.path.toLowerCase();
          if (lowerPath.endsWith('.mp4') || lowerPath.endsWith('.webm') || lowerPath.endsWith('.ogg') || lowerPath.endsWith('.avi') || lowerPath.endsWith('.mov') || lowerPath.endsWith('.mkv')) {
            // ALWAYS use encodeURI for file paths to prevent space/special character breaking
            const pathUri = file.path.replace(/\\/g, '/');
            const url = `file:///${encodeURI(pathUri).replace(/#/g, '%23').replace(/\?/g, '%3F')}`;
            if (window.electronAPI) {
              window.electronAPI.updateState({ videoSrc: url });
            } else {
              setVideoSrc(url);
            }
          } else {
            alert('File type not supported by the player! Please use a valid MP4/WEBM video file.');
          }
        }
      }
    };

    document.addEventListener('dragover', preventDefault, { capture: true });
    document.addEventListener('drop', handleGlobalDrop, { capture: true });

    // Listen to IPC updates from Main process
    if (window.electronAPI) {
      window.electronAPI.onStateUpdate((newState) => {
        if (newState.videoSrc !== undefined) setVideoSrc(newState.videoSrc);
        if (newState.isPlaying !== undefined) setIsPlaying(newState.isPlaying);
        if (newState.isMuted !== undefined) setIsMuted(newState.isMuted);
        if (newState.loop !== undefined) setLoop(newState.loop);
        if (newState.brightness !== undefined) setBrightness(newState.brightness);
        if (newState.blur !== undefined) setBlur(newState.blur);
        if (newState.playbackRate !== undefined) setPlaybackRate(newState.playbackRate);
        if (newState.isOnBattery !== undefined) setIsOnBattery(newState.isOnBattery);
        if (newState.isOccluded !== undefined) setIsOccluded(newState.isOccluded);
      });
      
      // Request initial state from main process
      window.electronAPI.requestState();
    }

    return () => {
      document.removeEventListener('dragover', preventDefault, { capture: true });
      document.removeEventListener('drop', handleGlobalDrop, { capture: true });
    };
  }, []);

  const updateState = (updates) => {
    if (window.electronAPI) {
      window.electronAPI.updateState(updates);
    } else {
      // Local fallback for browser testing
      if (updates.videoSrc !== undefined) setVideoSrc(updates.videoSrc);
      if (updates.isPlaying !== undefined) setIsPlaying(updates.isPlaying);
      if (updates.isMuted !== undefined) setIsMuted(updates.isMuted);
      if (updates.loop !== undefined) setLoop(updates.loop);
      if (updates.brightness !== undefined) setBrightness(updates.brightness);
      if (updates.blur !== undefined) setBlur(updates.blur);
      if (updates.playbackRate !== undefined) setPlaybackRate(updates.playbackRate);
      if (updates.isOnBattery !== undefined) setIsOnBattery(updates.isOnBattery);
    }
  };

  if (mode === 'wallpaper') {
    return (
      <div className="app-container">
        <VideoPlayer 
          src={videoSrc}
          isPlaying={isPlaying}
          isMuted={isMuted}
          loop={loop}
          brightness={brightness}
          blur={blur}
          playbackRate={playbackRate}
          isOnBattery={isOnBattery}
          isOccluded={isOccluded}
        />
      </div>
    );
  }

  return (
    <div className="app-container settings-mode drag-region">
      <ControlPanel 
        videoSrc={videoSrc}
        isPlaying={isPlaying}
        isMuted={isMuted}
        loop={loop}
        brightness={brightness}
        blur={blur}
        playbackRate={playbackRate}
        isOnBattery={isOnBattery}
        onUpdate={updateState}
      />
    </div>
  );
}

export default App;
