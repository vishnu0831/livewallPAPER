import { useEffect, useRef, useState } from 'react';

export default function VideoPlayer({ 
  src, isPlaying, isMuted, loop, brightness, blur, 
  saturation = 100, contrast = 100, // New props
  playbackRate, isOnBattery, isOccluded 
}) {
  const videoRef = useRef(null);
  const [isFading, setIsFading] = useState(false);
  const [displaySrc, setDisplaySrc] = useState(src);

  // Handle source changes with a cross-fade
  useEffect(() => {
    if (src !== displaySrc) {
      setIsFading(true);
      const timer = setTimeout(() => {
        setDisplaySrc(src);
        setIsFading(false);
      }, 400); // Match CSS transition
      return () => clearTimeout(timer);
    }
  }, [src, displaySrc]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying && !isOccluded) {
        videoRef.current.play().catch(e => console.log('Autoplay blocked', e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, isOccluded, displaySrc]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Screensaver activity monitoring
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isScreensaver = urlParams.get('mode') === 'screensaver';
    
    if (!isScreensaver) return;

    let startPos = null;
    const threshold = 10; 

    const handleActivity = (e) => {
      if (e.type === 'mousemove') {
        if (!startPos) {
          startPos = { x: e.screenX, y: e.screenY };
          return;
        }
        const dist = Math.sqrt(
          Math.pow(e.screenX - startPos.x, 2) + 
          Math.pow(e.screenY - startPos.y, 2)
        );
        if (dist < threshold) return;
      }
      
      if (window.electronAPI && window.electronAPI.exitScreensaver) {
        window.electronAPI.exitScreensaver();
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, []);

  useEffect(() => {
    if (!src) {
      if (window.electronAPI && window.electronAPI.notifyWallpaperReady) {
        window.electronAPI.notifyWallpaperReady();
      }
    }
  }, [src]);

  const lastCapturedSrc = useRef(null);

  const handleVideoError = (e) => {
    const error = e.target.error;
    console.error('Video Error:', error);
    if (error.code === 4) {
      alert('Format not supported (possibly H.265/HEVC). Please try an H.264 MP4 file.');
    }
  };

  const handlePlaying = () => {
    if (window.electronAPI && window.electronAPI.notifyWallpaperReady) {
      window.electronAPI.notifyWallpaperReady();
    }

    if (src && lastCapturedSrc.current !== src) {
      setTimeout(() => {
        if (videoRef.current && window.electronAPI && window.electronAPI.saveWallpaperFrame) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            if (canvas.width > 0 && canvas.height > 0) {
              const ctx = canvas.getContext('2d');
              ctx.drawImage(videoRef.current, 0, 0);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
              window.electronAPI.saveWallpaperFrame(dataUrl);
              lastCapturedSrc.current = src;
            }
          } catch (err) {
            console.error('Failed to capture wallpaper frame:', err);
          }
        }
      }, 1000);
    }
  };


  let filterString = '';
  if (brightness !== 100) filterString += `brightness(${brightness}%) `;
  if (blur !== 0) filterString += `blur(${blur}px) `;
  if (saturation !== 100) filterString += `saturate(${saturation}%) `;
  if (contrast !== 100) filterString += `contrast(${contrast}%)`;
  
  const style = { 
    filter: filterString.trim() || 'none',
    opacity: isFading ? 0 : 1,
    transition: 'opacity 0.4s ease-in-out, filter 0.3s ease'
  };

  return (
    <div className="video-container">
      {displaySrc ? (
        <video
          ref={videoRef}
          src={displaySrc}
          className="wallpaper-video"
          muted={isMuted}
          loop={loop}
          style={style}
          autoPlay
          onPlaying={handlePlaying}
          onError={handleVideoError}
        />
      ) : (
        <div className="no-video-placeholder" style={{...style, background: '#0a0a0f'}}>
          <h2 style={{background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2.5rem'}}>LiveWall</h2>
          <p style={{opacity: 0.5, marginTop: '20px', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700'}}>Ultimate Desktop Experience</p>
        </div>
      )}
    </div>
  );
}
