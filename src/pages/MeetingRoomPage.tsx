import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff,
  MessageSquare, Users, Brain, MoreHorizontal, Hand, Smile,
  Volume2, Settings, Maximize, Send, X
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { TEAM_MEMBERS, CHAT_MESSAGES } from '../data/mockData';

const participants = TEAM_MEMBERS.slice(0, 6);

const reactions = ['👍', '❤️', '😄', '🎉', '🤔', '👏'];

// Helper to get initials color
const avatarColors = [
  'from-indigo-500 to-violet-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
];

export default function MeetingRoomPage() {
  const { isMuted, isCameraOff, isScreenSharing, isRecording, toggleMute, toggleCamera, toggleScreenShare, toggleRecording, endMeeting } = useAppStore();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [hasWebcamStream, setHasWebcamStream] = useState(false);
  const [hasMicStream, setHasMicStream] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  const screenStreamRef = useRef<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [messages, setMessages] = useState(CHAT_MESSAGES.slice(0, 5));
  const [elapsed, setElapsed] = useState(0);
  const [handRaised, setHandRaised] = useState(false);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Bind local stream
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
      videoRef.current.play().catch(err => console.warn("Video play failed:", err));
    }
  }, [localStream, isCameraOff, hasWebcamStream]);

  // Bind screen share stream
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
      screenVideoRef.current.play().catch(err => console.warn("Screen share play failed:", err));
    }
  }, [screenStream, isScreenSharing]);

  useEffect(() => {
    let active = true;
    let fallbackInterval: any = null;

    async function initMedia() {
      let stream: MediaStream | null = null;
      try {
        // Try getting both video and audio first
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      } catch (err) {
        console.warn("Failed to get both video and audio together. Trying separately...", err);
        let videoStream: MediaStream | null = null;
        let audioStream: MediaStream | null = null;

        try {
          videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (videoErr) {
          console.warn("Failed to get video stream:", videoErr);
        }

        try {
          audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (audioErr) {
          console.warn("Failed to get audio stream:", audioErr);
        }

        if (videoStream || audioStream) {
          const tracks: MediaStreamTrack[] = [];
          if (videoStream) tracks.push(...videoStream.getVideoTracks());
          if (audioStream) tracks.push(...audioStream.getAudioTracks());
          stream = new MediaStream(tracks);
        }
      }

      if (stream && active) {
        // If the hardware stream is missing an audio track (e.g. permission denied or unplugged),
        // we add a silent mock audio track so that recording and other features don't fail.
        if (stream.getAudioTracks().length === 0) {
          try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
              const audioCtx = new AudioContextClass();
              audioContextRef.current = audioCtx;
              audioCtx.resume().catch(() => {});
              const dest = audioCtx.createMediaStreamDestination();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              gain.gain.value = 0.001; // near silent
              osc.connect(gain);
              gain.connect(dest);
              osc.start();
              const mockAudioTrack = dest.stream.getAudioTracks()[0];
              if (mockAudioTrack) {
                stream.addTrack(mockAudioTrack);
                console.log("Successfully generated and added a fallback silent audio track to local stream.");
              }
            }
          } catch (e) {
            console.warn("Failed to generate fallback silent audio track in initMedia:", e);
          }
        }

        streamRef.current = stream;
        setLocalStream(stream);
        setHasWebcamStream(stream.getVideoTracks().length > 0);
        setHasMicStream(stream.getAudioTracks().length > 0);

        stream.getAudioTracks().forEach(t => {
          t.enabled = !isMuted;
        });
        stream.getVideoTracks().forEach(t => {
          t.enabled = !isCameraOff;
        });
      } else if (active) {
        console.warn("Hardware camera/microphone unavailable or permission denied. Creating simulated fallback stream.");
        // Fallback: Create dynamic canvas stream to simulate camera output
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');

        let audioTrack: MediaStreamTrack | null = null;
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          audioCtx.resume().catch(() => {});
          const dest = audioCtx.createMediaStreamDestination();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          gain.gain.value = 0.001; // near silent
          osc.connect(gain);
          gain.connect(dest);
          osc.start();
          audioTrack = dest.stream.getAudioTracks()[0];
        } catch { }

        let angle = 0;
        fallbackInterval = setInterval(() => {
          if (!ctx) return;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 640, 480);

          const pulse = 100 + Math.sin(angle) * 15;
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(320, 240, pulse, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(320, 240, pulse + 30, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 56px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('AJ', 320, 230);

          ctx.fillStyle = '#818cf8';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText('Simulated Meeting Feed', 320, 310);

          ctx.fillStyle = '#64748b';
          ctx.font = '12px sans-serif';
          ctx.fillText('Hardware camera permission denied or unavailable', 320, 340);

          angle += 0.08;
        }, 1000 / 30);

        const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : null;
        const videoTrack = canvasStream ? canvasStream.getVideoTracks()[0] : null;

        const tracks = [];
        if (videoTrack) tracks.push(videoTrack);
        if (audioTrack) tracks.push(audioTrack);

        const fallbackStream = new MediaStream(tracks);
        streamRef.current = fallbackStream;
        setLocalStream(fallbackStream);
        setHasWebcamStream(true);
        setHasMicStream(audioTrack !== null);

        fallbackStream.getAudioTracks().forEach(t => {
          t.enabled = !isMuted;
        });
        fallbackStream.getVideoTracks().forEach(t => {
          t.enabled = !isCameraOff;
        });
      }
    }

    initMedia();

    return () => {
      active = false;
      if (fallbackInterval) clearInterval(fallbackInterval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setLocalStream(null);
    };
  }, []);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isCameraOff;
      });
    }
  }, [isCameraOff, localStream]);

  useEffect(() => {
    if (streamRef.current) {
      const activeState = !isMuted && audioEnabled;
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = activeState;
      });
      showNotification(activeState ? 'Microphone active' : 'Microphone muted');
    }
  }, [isMuted, audioEnabled, localStream]);

  // Analyze local microphone level for dynamic visualizer
  useEffect(() => {
    if (!localStream || isMuted || !audioEnabled) {
      setMicLevel(0);
      return;
    }

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) {
      setMicLevel(0);
      return;
    }

    let audioCtx: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let animationFrameId: number;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AudioContextClass();
      audioCtx.resume().catch(() => {});
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      
      source = audioCtx.createMediaStreamSource(localStream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        
        let values = 0;
        for (let i = 0; i < bufferLength; i++) {
          values += dataArray[i];
        }
        const average = values / bufferLength;
        setMicLevel(Math.min(100, Math.round((average / 128) * 100)));
        animationFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn("Failed to initialize audio analyzer:", e);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (source) source.disconnect();
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
    };
  }, [localStream, isMuted, audioEnabled]);


  useEffect(() => {
    let active = true;

    async function startScreenShare() {
      if (!isScreenSharing) {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }
        setScreenStream(null);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        screenStreamRef.current = stream;
        setScreenStream(stream);

        // Auto-stop if user clicks native "Stop Sharing" button
        stream.getVideoTracks()[0].onended = () => {
          if (isScreenSharing) {
            toggleScreenShare();
          }
        };

        showNotification('Screen sharing started');
      } catch (err) {
        console.error("Error sharing screen:", err);
        setScreenStream(null);
        if (isScreenSharing) {
          toggleScreenShare();
        }
      }
    }

    startScreenShare();

    return () => {
      active = false;
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      setScreenStream(null);
    };
  }, [isScreenSharing]);

  useEffect(() => {
    if (!isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        showNotification('Recording saved successfully');
      }
      return;
    }

    // Automatically unmute microphone when starting a recording
    if (isMuted) {
      toggleMute();
    }
    if (!audioEnabled) {
      setAudioEnabled(true);
    }
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
    }

    // Resume the fallback AudioContext if it exists and is suspended
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(err => console.warn("Failed to resume fallback AudioContext:", err));
    }

    // Combine video (screen or camera) with microphone/system audio tracks
    let streamToRecord: MediaStream | null = null;
    if (isScreenSharing && screenStreamRef.current) {
      const tracks: MediaStreamTrack[] = [];
      
      // Screen video track
      const screenVideoTracks = screenStreamRef.current.getVideoTracks();
      if (screenVideoTracks.length > 0) {
        tracks.push(screenVideoTracks[0]);
      }
      
      // Get screen audio and mic audio
      const screenAudioTracks = screenStreamRef.current.getAudioTracks();
      const micAudioTracks = streamRef.current ? streamRef.current.getAudioTracks() : [];
      
      if (screenAudioTracks.length > 0 && micAudioTracks.length > 0) {
        // We have both screen audio and microphone audio. Let's mix them!
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioCtx.resume().catch(() => {});
          
          const dest = audioCtx.createMediaStreamDestination();
          
          const screenSource = audioCtx.createMediaStreamSource(new MediaStream([screenAudioTracks[0]]));
          const micSource = audioCtx.createMediaStreamSource(new MediaStream([micAudioTracks[0]]));
          
          screenSource.connect(dest);
          micSource.connect(dest);
          
          const mixedAudioTrack = dest.stream.getAudioTracks()[0];
          if (mixedAudioTrack) {
            tracks.push(mixedAudioTrack);
            console.log("Successfully mixed screen audio and microphone audio.");
          }
        } catch (e) {
          console.warn("Failed to mix screen and microphone audio:", e);
          // Fallback to just microphone or screen audio
          tracks.push(micAudioTracks[0] || screenAudioTracks[0]);
        }
      } else if (screenAudioTracks.length > 0) {
        tracks.push(screenAudioTracks[0]);
      } else if (micAudioTracks.length > 0) {
        tracks.push(micAudioTracks[0]);
      }
      
      streamToRecord = new MediaStream(tracks);
    } else {
      streamToRecord = streamRef.current;
    }

    if (!streamToRecord) {
      showNotification('No active stream to record');
      if (isRecording) toggleRecording();
      return;
    }

    // Ensure we have at least one audio track to prevent "No mic audio detected" warning
    if (streamToRecord.getAudioTracks().length === 0) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx; // Store for future reference
          audioCtx.resume().catch(() => {});
          const dest = audioCtx.createMediaStreamDestination();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          gain.gain.value = 0.001; // near silent
          osc.connect(gain);
          gain.connect(dest);
          osc.start();
          const mockAudioTrack = dest.stream.getAudioTracks()[0];
          if (mockAudioTrack) {
            try {
              streamToRecord.addTrack(mockAudioTrack);
            } catch {
              const combinedTracks = [...streamToRecord.getVideoTracks(), mockAudioTrack];
              streamToRecord = new MediaStream(combinedTracks);
            }
            if (streamRef.current) {
              try {
                streamRef.current.addTrack(mockAudioTrack);
              } catch {}
            }
            console.log("Added silent mock audio track to recording stream.");
          }
        }
      } catch (e) {
        console.warn("Failed to generate fallback audio track during recording:", e);
      }
    }

    recordedChunksRef.current = [];
    try {
      let recorder: MediaRecorder | undefined;
      const optionsList = [
        { mimeType: 'video/webm; codecs=vp9,opus' },
        { mimeType: 'video/webm; codecs=vp8,opus' },
        { mimeType: 'video/webm' }
      ];
      
      for (const opt of optionsList) {
        try {
          recorder = new MediaRecorder(streamToRecord, opt);
          break;
        } catch (e) {
          console.warn(`MIME type ${opt.mimeType} not supported:`, e);
        }
      }
      
      if (!recorder) {
        recorder = new MediaRecorder(streamToRecord);
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder?.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `intellmeet-recording-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      
      const audioTracks = streamToRecord.getAudioTracks();
      console.log("Recording stream tracks:", streamToRecord.getTracks().map(t => `${t.kind}: enabled=${t.enabled}, state=${t.readyState}`));
      if (audioTracks.length === 0) {
        showNotification('Recording started (No mic audio detected)');
      } else if (audioTracks.some(t => !t.enabled)) {
        showNotification('Recording started (Microphone is muted)');
      } else {
        showNotification('Recording started');
      }
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      showNotification('Failed to start recording');
      if (isRecording) toggleRecording();
    }
  }, [isRecording]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
      showNotification('Fullscreen mode enabled');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
        showNotification('Fullscreen mode disabled');
      }
    }
  };
  const [aiTranscript] = useState<string[]>([
    '...discussing the sprint velocity and action items for this cycle.',
    'Key point: Video recording feature deployed successfully.',
    'Action item identified: PR #142 to be reviewed by Mike.',
  ]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const sendMessage = () => {
    if (!chatMsg.trim()) return;
    setMessages(prev => [...prev, {
      id: `c${Date.now()}`,
      sender: 'Alex Johnson',
      avatar: 'AJ',
      message: chatMsg,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      type: 'text'
    }]);
    setChatMsg('');
  };

  const triggerReaction = (emoji: string) => {
    setActiveReaction(emoji);
    setShowReactions(false);
    setTimeout(() => setActiveReaction(null), 2500);
  };

  return (
    <div className="fixed inset-0 bg-[#070b14] flex flex-col z-40">
      {/* Top Bar */}
      <div className="h-14 glass-dark border-b border-white/5 flex items-center px-4 gap-4 shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 status-live" />
            <span className="text-sm font-bold text-white">Sprint Review - Q2 2026</span>
          </div>
          <span className="text-xs text-gray-500">·</span>
          <span className="text-xs text-gray-400 font-mono">{formatTime(elapsed)}</span>
          {isRecording && (
            <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/15 border border-red-500/30 px-2 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 rec-dot" />
              Recording
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 flex items-center gap-1.5 mr-2">
            <Users className="w-3.5 h-3.5" /> {participants.length} participants
          </span>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullScreen}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video & Screen Share Container */}
        <div className="flex-1 flex flex-col lg:flex-row p-4 gap-3 overflow-hidden relative">
          {isScreenSharing && (
            <div className="flex-[2] relative rounded-2xl overflow-hidden border border-indigo-500/30 bg-[#0c0f17] flex items-center justify-center min-h-[300px]">
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs text-indigo-300 font-semibold flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                You are sharing your screen
              </div>
            </div>
          )}

          {/* Video Grid */}
          <div className={`flex-1 grid gap-3 overflow-y-auto ${isScreenSharing ? 'grid-cols-2 lg:grid-cols-1 lg:max-w-xs' : 'grid-cols-3'}`}>
            {participants.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className={`relative rounded-2xl overflow-hidden border border-white/5 group ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
                style={{ background: 'linear-gradient(135deg, #0d1117 0%, #1a1f2e 100%)', minHeight: i === 0 ? '300px' : '140px' }}
              >
                {/* Video placeholder - gradient avatar */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-xl font-black shadow-lg ${i === 0 ? 'w-24 h-24 text-2xl' : ''}`}>
                    {p.avatar}
                  </div>
                </div>

                {/* Animated border for speaker */}
                {i === 0 && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/60 pointer-events-none" />
                )}

                {/* Participant info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{p.name.split(' ')[0]}{i === 0 ? ' (Host)' : ''}</span>
                      {i === 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-live" />}
                    </div>
                    <div className="flex items-center gap-1">
                      {Math.random() > 0.5 && <MicOff className="w-3 h-3 text-red-400" />}
                    </div>
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-2xl pointer-events-none" />
              </motion.div>
            ))}

            {/* My video tile */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="relative rounded-2xl overflow-hidden border border-indigo-500/30"
              style={{ background: 'linear-gradient(135deg, #1a1520 0%, #2d1b4e 100%)', minHeight: '140px' }}
            >
              {isCameraOff || !hasWebcamStream ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg font-black">AJ</div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                />
              )}
              <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500/40 pointer-events-none" />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">You</span>
                  {!hasMicStream ? (
                    <span className="text-[9px] text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-1 rounded flex items-center gap-1">
                      ⚠️ No Mic
                    </span>
                  ) : !isMuted && micLevel > 0 ? (
                    <div className="flex items-center gap-0.5 h-3">
                      {[1, 2, 3].map((bar) => {
                        const scale = Math.max(0.2, (micLevel / 100) * (bar === 2 ? 1 : 0.7));
                        return (
                          <div
                            key={bar}
                            className="w-0.5 bg-emerald-400 rounded-full transition-all duration-75"
                            style={{ height: `${scale * 100}%` }}
                          />
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  {!hasMicStream || isMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-emerald-400" />}
                  {isCameraOff && <VideoOff className="w-3 h-3 text-red-400" />}
                </div>
              </div>
            </motion.div>

            {/* Floating Reaction */}
            <AnimatePresence>
              {activeReaction && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 0 }}
                  animate={{ opacity: 1, scale: 1.5, y: -60 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute bottom-24 left-1/2 -translate-x-1/2 text-4xl pointer-events-none z-50"
                >
                  {activeReaction}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hand Raised */}
            <AnimatePresence>
              {handRaised && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-xs text-amber-400"
                >
                  ✋ You raised your hand
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Side Panels */}
        <AnimatePresence>
          {(showChat || showParticipants || showAIPanel) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="glass-dark border-l border-white/5 flex flex-col overflow-hidden shrink-0"
            >
              {/* Panel Tabs */}
              <div className="flex items-center border-b border-white/5 shrink-0">
                {[
                  { key: 'chat', label: 'Chat', icon: MessageSquare, action: () => { setShowChat(true); setShowParticipants(false); setShowAIPanel(false); } },
                  { key: 'participants', label: 'People', icon: Users, action: () => { setShowParticipants(true); setShowChat(false); setShowAIPanel(false); } },
                  { key: 'ai', label: 'AI Live', icon: Brain, action: () => { setShowAIPanel(true); setShowChat(false); setShowParticipants(false); } },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={tab.action}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all ${(tab.key === 'chat' && showChat) || (tab.key === 'participants' && showParticipants) || (tab.key === 'ai' && showAIPanel)
                      ? 'text-indigo-400 border-b-2 border-indigo-500'
                      : 'text-gray-500 hover:text-gray-300'
                      }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
                <button
                  onClick={() => { setShowChat(false); setShowParticipants(false); setShowAIPanel(false); }}
                  className="p-3 text-gray-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Panel */}
              {showChat && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex items-start gap-2 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] font-bold shrink-0">
                          {msg.avatar}
                        </div>
                        <div className={`max-w-[70%] ${msg.isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          {!msg.isMe && <span className="text-[10px] text-gray-500">{msg.sender}</span>}
                          <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${msg.isMe ? 'bg-indigo-600/40 text-indigo-100 rounded-tr-sm' : 'bg-white/5 text-gray-300 rounded-tl-sm'}`}>
                            {msg.message}
                          </div>
                          <span className="text-[10px] text-gray-600">{msg.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-white/5 flex gap-2">
                    <input
                      value={chatMsg}
                      onChange={(e) => setChatMsg(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Message everyone..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/40 focus:outline-none text-xs text-white placeholder-gray-600"
                    />
                    <button onClick={sendMessage} className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Participants Panel */}
              {showParticipants && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  <p className="text-xs text-gray-500 mb-3">In this meeting ({participants.length + 1})</p>
                  {/* Me first */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold shrink-0">AJ</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white">Alex Johnson (You)</div>
                      <div className="text-xs text-gray-500">Host · Admin</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </div>
                  {participants.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/3 transition-all">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-xs font-bold shrink-0`}>
                        {p.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.team}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {i % 3 === 0 ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-emerald-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Live Panel */}
              {showAIPanel && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(b => (
                          <div key={b} className="w-1 bg-indigo-400 rounded-full ai-wave-bar" style={{ height: '12px' }} />
                        ))}
                      </div>
                      <span className="text-xs text-indigo-300 font-semibold">AI Transcribing Live</span>
                    </div>
                    <p className="text-xs text-gray-500">Real-time transcription with 89% accuracy</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Live Transcript</p>
                    {aiTranscript.map((line, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-gray-300 bg-white/3 rounded-lg p-2.5 leading-relaxed border border-white/5"
                      >
                        {line}
                      </motion.div>
                    ))}
                    <div className="flex items-center gap-2 text-xs text-gray-600 italic px-1">
                      <div className="flex gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500 typing-dot" />
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500 typing-dot" />
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500 typing-dot" />
                      </div>
                      Processing...
                    </div>
                  </div>
                  <div className="p-3 border-t border-white/5">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                      <p className="text-xs text-indigo-300 font-semibold mb-1">🤖 AI Insight</p>
                      <p className="text-xs text-gray-400">Action item detected: "Mike will review PR #142 by Thursday"</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Bar */}
      <div className="h-20 glass-dark border-t border-white/5 flex items-center justify-between px-6 shrink-0">
        {/* Left Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${isMuted ? 'bg-red-500/20 border border-red-500/30 text-red-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-[10px]">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>
          <button
            onClick={toggleCamera}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${isCameraOff ? 'bg-red-500/20 border border-red-500/30 text-red-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            <span className="text-[10px]">{isCameraOff ? 'Start Cam' : 'Stop Cam'}</span>
          </button>
          <button
            onClick={toggleScreenShare}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${isScreenSharing ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            <span className="text-[10px]">{isScreenSharing ? 'Stop Share' : 'Share'}</span>
          </button>
          <button
            onClick={toggleRecording}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500/20 border border-red-500/30 text-red-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            <Maximize className="w-5 h-5" />
            <span className="text-[10px]">{isRecording ? 'Stop Rec' : 'Record'}</span>
          </button>
        </div>

        {/* Center Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHandRaised(!handRaised)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${handRaised ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            <Hand className="w-5 h-5" />
            <span className="text-[10px]">Hand</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-all"
            >
              <Smile className="w-5 h-5" />
              <span className="text-[10px]">React</span>
            </button>
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-2 glass rounded-xl p-2 border border-white/10"
                >
                  {reactions.map(r => (
                    <button key={r} onClick={() => triggerReaction(r)} className="text-xl hover:scale-125 transition-transform cursor-pointer">
                      {r}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              showNotification(audioEnabled ? 'Workspace audio muted' : 'Workspace audio unmuted');
            }}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all cursor-pointer ${!audioEnabled ? 'bg-red-500/20 border border-red-500/30 text-red-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            <span className="text-[10px]">Audio</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowChat(!showChat); if (!showChat) { setShowParticipants(false); setShowAIPanel(false); } }}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${showChat ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px]">Chat</span>
          </button>
          <button
            onClick={() => { setShowParticipants(!showParticipants); if (!showParticipants) { setShowChat(false); setShowAIPanel(false); } }}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${showParticipants ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px]">People</span>
          </button>
          <button
            onClick={() => { setShowAIPanel(!showAIPanel); if (!showAIPanel) { setShowChat(false); setShowParticipants(false); } }}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${showAIPanel ? 'bg-violet-500/20 border border-violet-500/30 text-violet-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            <Brain className="w-5 h-5" />
            <span className="text-[10px]">AI Live</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all cursor-pointer ${showMoreMenu ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px]">More</span>
            </button>
            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-2 w-48 glass rounded-xl p-2 border border-white/10 flex flex-col gap-1 z-50"
                >
                  {[
                    { label: 'Change Layout', action: () => showNotification('Spotlight mode layout selected') },
                    { label: 'Blur Background', action: () => showNotification('Virtual background blur applied') },
                    { label: 'Troubleshoot', action: () => setShowSettingsModal(true) },
                    { label: 'Meeting Info', action: () => showNotification('Meeting link copied to clipboard!') },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={() => { item.action(); setShowMoreMenu(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* End Call */}
          <button
            onClick={endMeeting}
            className="flex flex-col items-center gap-1 p-3 px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all hover:scale-105"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-[10px]">End</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md glass-dark rounded-2xl border border-white/10 p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 pointer-events-none" />
              <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  Meeting Settings
                </h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 relative z-10">
                {/* Audio Device */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Microphone</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/40">
                    <option className="bg-[#0b0f19]">Default Microphone (System Audio)</option>
                    <option className="bg-[#0b0f19]">External Mic (High Definition)</option>
                  </select>
                </div>

                {/* Video Device */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Camera</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/40">
                    <option className="bg-[#0b0f19]">Integrated Webcam (1080p HD)</option>
                    <option className="bg-[#0b0f19]">OBS Virtual Camera</option>
                  </select>
                </div>

                {/* Speaker Output */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Speaker Output</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/40">
                    <option className="bg-[#0b0f19]">System Speakers (Realtek Audio)</option>
                    <option className="bg-[#0b0f19]">Wireless Headphones (Stereo)</option>
                  </select>
                </div>

                {/* Noise suppression toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                  <div>
                    <h5 className="text-xs font-bold text-white">AI Noise Suppression</h5>
                    <p className="text-[10px] text-gray-500">Filter out background clatter</p>
                  </div>
                  <button className="w-10 h-6 bg-indigo-600 rounded-full flex items-center justify-end px-1.5 transition-all cursor-pointer">
                    <span className="w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 relative z-10">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-5 py-2 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-indigo-600/90 backdrop-blur-md text-white text-xs font-bold shadow-xl border border-indigo-500/30 z-50 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
