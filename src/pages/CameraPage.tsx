import { useEffect, useRef, useState, useCallback } from 'react';
import { useGridSense } from '@/contexts/GridSenseContext';
import * as faceapi from 'face-api.js';
import { motion } from 'framer-motion';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';

export default function CameraPage() {
  const {
    rooms, selectedCameraRoom, setSelectedCameraRoom,
    cameraActive, setCameraActive, modelLoaded, setModelLoaded,
    modelError, setModelError, detectFaces, noFacesDetected, settings,
  } = useGridSense();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [faceCount, setFaceCount] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const sensitivityThreshold = settings.detectionSensitivity <= 30 ? 0.5 : settings.detectionSensitivity <= 70 ? 0.7 : 0.85;

  // Load models
  useEffect(() => {
    if (modelLoaded) return;
    setLoading(true);
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    ]).then(() => {
      setModelLoaded(true);
      setLoading(false);
    }).catch(() => {
      setModelError(true);
      setLoading(false);
    });
  }, [modelLoaded, setModelLoaded, setModelError]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setPermissionDenied(false);
    } catch {
      setPermissionDenied(true);
    }
  }, [setCameraActive]);

  const stopCamera = useCallback(() => {
    if (detectionRef.current) { cancelAnimationFrame(detectionRef.current); detectionRef.current = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setFaceCount(0);
    setConfidence(0);
  }, [setCameraActive]);

  // Detection loop
  useEffect(() => {
    if (!cameraActive || !modelLoaded || !videoRef.current) return;

    let lastDetection = 0;
    const detect = async () => {
      const now = Date.now();
      if (now - lastDetection >= 300 && videoRef.current && videoRef.current.readyState >= 2) {
        lastDetection = now;
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
        );

        const validFaces = detections.filter(d => d.score >= sensitivityThreshold);

        // Draw on canvas
        if (canvasRef.current && videoRef.current) {
          const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
          const resized = faceapi.resizeResults(detections, dims);
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            resized.forEach(d => {
              const { x, y, width, height } = d.box;
              ctx.strokeStyle = d.score >= sensitivityThreshold ? '#10B981' : '#F59E0B';
              ctx.lineWidth = 2;
              ctx.strokeRect(x, y, width, height);
              ctx.fillStyle = d.score >= sensitivityThreshold ? '#10B981' : '#F59E0B';
              ctx.font = '12px IBM Plex Mono';
              ctx.fillText(`${Math.round(d.score * 100)}%`, x, y - 4);
            });
          }
        }

        setFaceCount(validFaces.length);
        const maxConf = validFaces.length > 0 ? Math.max(...validFaces.map(d => d.score)) : 0;
        setConfidence(maxConf);

        if (validFaces.length > 0) {
          detectFaces(selectedCameraRoom, validFaces.length, maxConf);
        } else {
          noFacesDetected(selectedCameraRoom);
        }
      }
      detectionRef.current = requestAnimationFrame(detect);
    };
    detectionRef.current = requestAnimationFrame(detect);
    return () => { if (detectionRef.current) cancelAnimationFrame(detectionRef.current); };
  }, [cameraActive, modelLoaded, selectedCameraRoom, sensitivityThreshold, detectFaces, noFacesDetected]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const selectedRoom = rooms.find(r => r.id === selectedCameraRoom);

  return (
    <div className="h-screen flex flex-col lg:flex-row p-6 gap-6 overflow-hidden">
      {/* Video area */}
      <div className="flex-1 lg:flex-[4] relative glass-panel rounded-xl overflow-hidden flex items-center justify-center min-h-[300px]">
        {!cameraActive && !loading && !modelError && (
          <div className="text-center space-y-4 z-10">
            {permissionDenied ? (
              <>
                <p className="text-gs-amber text-sm">Camera permission denied.</p>
                <p className="text-xs text-muted-foreground">Please allow camera access in your browser settings.</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm text-muted-foreground">Start camera to begin face detection</p>
              </>
            )}
            <button onClick={startCamera} className="btn-pill" disabled={!modelLoaded && !loading}>
              {loading ? 'Loading Models...' : 'Start Camera'}
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center space-y-3 z-10">
            <div className="w-16 h-16 rounded-full border-2 border-primary/20 flex items-center justify-center mx-auto">
              <div className="w-3 h-3 rounded-full bg-primary init-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">Initializing face detection models...</p>
          </div>
        )}

        {modelError && (
          <div className="text-center space-y-3 z-10">
            <p className="text-gs-red text-sm">Failed to load face detection models</p>
            <button onClick={() => { setModelError(false); setModelLoaded(false); }} className="btn-danger">
              Retry
            </button>
          </div>
        )}

        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline style={{ transform: 'scaleX(-1)' }} />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ transform: 'scaleX(-1)' }} />

        {/* Confidence badge */}
        {cameraActive && (
          <div className="absolute top-4 right-4 glass-panel rounded-lg px-3 py-2 z-10">
            <div className="text-xs text-muted-foreground">Confidence</div>
            <div className={`font-mono text-lg font-bold ${confidence > 0.7 ? 'text-gs-green' : confidence > 0 ? 'text-gs-amber' : 'text-muted-foreground'}`}>
              {confidence > 0 ? `${Math.round(confidence * 100)}%` : '--'}
            </div>
          </div>
        )}

        {cameraActive && (
          <div className="absolute top-4 left-4 glass-panel rounded-lg px-3 py-2 z-10">
            <div className="text-xs text-muted-foreground">Faces</div>
            <div className="font-mono text-lg font-bold text-foreground">{faceCount}</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="lg:flex-[2] flex flex-col gap-4">
        <div className="glass-panel rounded-xl p-5">
          <h2 className="font-mono text-sm font-semibold text-foreground mb-4">Camera Controls</h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Monitor Room</label>
              <select
                value={selectedCameraRoom}
                onChange={e => setSelectedCameraRoom(Number(e.target.value))}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              {!cameraActive ? (
                <button onClick={startCamera} className="btn-pill flex-1" disabled={loading || modelError}>
                  ▶ Start Camera
                </button>
              ) : (
                <button onClick={stopCamera} className="btn-danger flex-1">
                  ⏹ Stop Camera
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Selected room status */}
        {selectedRoom && (
          <motion.div
            key={selectedRoom.status}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`glass-panel rounded-xl p-5 ${
              selectedRoom.status === 'on' ? 'glow-green' :
              selectedRoom.status === 'countdown' ? 'glow-amber' : ''
            }`}
          >
            <h3 className="font-mono text-sm font-semibold text-foreground mb-2">{selectedRoom.name}</h3>
            <div className={`text-2xl font-mono font-bold ${
              selectedRoom.status === 'on' ? 'text-gs-green' :
              selectedRoom.status === 'countdown' ? 'text-gs-amber' :
              'text-muted-foreground'
            }`}>
              {selectedRoom.status === 'on' ? '🟢 ONLINE' :
               selectedRoom.status === 'countdown' ? `🟡 OFF in ${selectedRoom.countdownRemaining}s` :
               '⚫ OFFLINE'}
            </div>
            {selectedRoom.faceCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedRoom.faceCount} face(s) · {Math.round(selectedRoom.confidence * 100)}% confidence
              </p>
            )}
          </motion.div>
        )}

        <div className="glass-panel rounded-xl p-5">
          <h3 className="font-mono text-xs font-semibold text-muted-foreground mb-2">Detection Info</h3>
          <div className="space-y-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <p>• Sensitivity: {settings.detectionSensitivity <= 30 ? 'Low (50%)' : settings.detectionSensitivity <= 70 ? 'Medium (70%)' : 'High (85%)'}</p>
            <p>• Power-off delay: {settings.powerOffDelay}s</p>
            <p>• Detection interval: ~300ms</p>
            <p>• Model: TinyFaceDetector</p>
          </div>
        </div>
      </div>
    </div>
  );
}
