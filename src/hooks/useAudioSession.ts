import { useEffect, useRef, useState } from 'react';
import AudioClient from '../../audio-client';

interface UseAudioSessionReturn {
  activeCall: boolean;
  connecting: boolean;
  speaking: boolean;
  isRecording: boolean;
  messages: Array<{ content: string; role: string }>;
  startCall: (userId: string, userName: string) => Promise<void>;
  stopCall: () => void;
  toggleRecording: () => Promise<void>;
}

export const useAudioSession = (): UseAudioSessionReturn => {
  const [activeCall, setActiveCall] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Array<{ content: string; role: string }>>([]);
  
  const audioClientRef = useRef<InstanceType<typeof AudioClient> | null>(null);
  const isInitializingRef = useRef(false);
  
  // Refs for accumulating text from AI responses
  const currentResponseTextRef = useRef<string>('');
  const currentResponseElementRef = useRef<{ content: string; role: string } | null>(null);

  const startCall = async (userId: string, userName: string) => {
    if (isInitializingRef.current || audioClientRef.current) {
      console.log('Audio client already initialized');
      return;
    }

    try {
      setConnecting(true);
      setMessages([]);
      isInitializingRef.current = true;

      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize AudioClient
      const client = new AudioClient();
      
      // Set user ID (this will be sent on connection)
      client.setUserId(userId);

      // Set up callbacks
      client.onReady = () => {
        console.log('✅ Audio client ready');
        setConnecting(false);
        setActiveCall(true);
        setMessages([{
          content: `Hello ${userName}! I'm GenX, your AI fitness coach. Let's create your personalized fitness plan. What are your fitness goals?`,
          role: 'assistant'
        }]);
      };

      client.onAudioReceived = () => {
        setSpeaking(true);
      };

      client.onTurnComplete = () => {
        setSpeaking(false);
        // Reset refs for next response
        currentResponseTextRef.current = '';
        currentResponseElementRef.current = null;
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any).onTextReceived = (text: string) => {
        if (text && text.trim()) {
          if (!currentResponseElementRef.current) {
            // First chunk - create new message
            currentResponseTextRef.current = text;
            currentResponseElementRef.current = { content: text, role: 'assistant' };
            setMessages(prev => [...prev, currentResponseElementRef.current!]);
          } else {
            // Subsequent chunks - accumulate text
            currentResponseTextRef.current += ' ' + text.trim();
            currentResponseElementRef.current.content = currentResponseTextRef.current;
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = { ...currentResponseElementRef.current! };
              return newMessages;
            });
          }
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any).onError = (error: unknown) => {
        console.error('Audio client error:', error);
        setConnecting(false);
        setActiveCall(false);
        isInitializingRef.current = false;
      };

      // Connect to WebSocket server
      await client.connect();

      audioClientRef.current = client;
      isInitializingRef.current = false;

    } catch (error) {
      console.error('Failed to start call:', error);
      setConnecting(false);
      setActiveCall(false);
      isInitializingRef.current = false;
      
      if (error instanceof Error && error.name === 'NotAllowedError') {
        alert('Microphone permission is required to use the AI coach. Please allow microphone access and try again.');
      }
    }
  };

  const toggleRecording = async () => {
    if (!audioClientRef.current) return;
    
    if (isRecording) {
      // Stop recording
      audioClientRef.current.stopRecording();
      setIsRecording(false);
      setMessages(prev => prev.filter(msg => msg.content !== 'Listening...'));
      console.log('🔴 Microphone OFF');
    } else {
      // Start recording
      const success = await audioClientRef.current.startRecording();
      if (success) {
        setIsRecording(true);
        setMessages(prev => [...prev, { content: 'Listening...', role: 'user' }]);
        console.log('🎤 Microphone ON');
      }
    }
  };

  const stopCall = () => {
    if (isRecording) {
      audioClientRef.current?.stopRecording();
      setIsRecording(false);
    }
    if (audioClientRef.current) {
      audioClientRef.current.close();
      audioClientRef.current = null;
    }
    
    setActiveCall(false);
    setConnecting(false);
    setSpeaking(false);
    setIsRecording(false);
    isInitializingRef.current = false;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioClientRef.current) {
        audioClientRef.current.close();
      }
    };
  }, []);

  return {
    activeCall,
    connecting,
    speaking,
    isRecording,
    messages,
    startCall,
    stopCall,
    toggleRecording,
  };
};
