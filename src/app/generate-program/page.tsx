"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { vapi } from "@/lib/vapi";
import { useUser } from "@clerk/nextjs";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const GenerateProgram = () => {
  const [activeCall, setActiveCall] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [message, setMessage] = useState<any[]>([]);
  const [callEnded, setCallEnded] = useState(false);

  const { user } = useUser();
  const router = useRouter();

  const msgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msgContainerRef.current) {
      msgContainerRef.current.scrollTop = msgContainerRef.current.scrollHeight;
    }
  }, [message]);

  useEffect(() => {
    if (callEnded) {
      const timeout = setTimeout(() => {
        router.push("/profile");
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [callEnded, router]);

  useEffect(() => {
    const handleCallStart = () => {
      console.log("Call started");
      setConnecting(false);
      setActiveCall(true);
      setCallEnded(false);
    };
    const handleCallEnd = () => {
      console.log("Call ended");
      setActiveCall(false);
      setConnecting(false);
      setSpeaking(false);
      setCallEnded(true);
    };
    const handleSpeechStart = () => {
      console.log("Speech started");
      setSpeaking(true);
    };
    const handleSpeechEnd = () => {
      console.log("Speech ended");
      setSpeaking(false);
    };
    const handleMessage = (message: any) => {
      if(message.type === "transcript" && message.transcriptType === "final"){
        const newMessage = {content:message.transcript, role:message.role}
        setMessage(prev =>[...prev, newMessage]);
      }
    };
    const handleError = (error: any) => {
      console.log("Error in vapi connection", error);
      setConnecting(false);
      setActiveCall(false);
    };
    vapi
      .on("call-start", handleCallStart)
      .on("call-end", handleCallEnd)
      .on("speech-start", handleSpeechStart)
      .on("speech-end", handleSpeechEnd)
      .on("message", handleMessage)
      .on("error", handleError);
    return () => {
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("message", handleMessage);
      vapi.off("error", handleError);
    };
  }, []);

  const startCall = async () => {
    if (activeCall) vapi.stop();
    else {
      try {
        setConnecting(true);
        setMessage([]);
        setCallEnded(false);
        const fullName = user?.firstName
          ? `${user.firstName} ${user.lastName || ""}`.trim()
          : "User";
        await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
          variableValues: {
            full_name: fullName,
          },
        });
      } catch (error) {
        console.log("Failed to start call", error);
        setConnecting(false);
      }
    }
  };
  return (
    <div className="flex flex-col min-h-screen text-foreground overflow-hidden pb-6 pt-24">
      <div className="container mx-auto px-4 h-full max-w-5xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono">
            <span>Generate Your </span>
            <span className="text-primary uppercase">Fitness Program</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Have a voice conversation with our AI assistant to create your
            personalized plan
          </p>
        </div>

        {/*Video Call */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/*Assistant card */}
          <Card className="bg-card/90 backdrop-blur-sm border border-border overflow-hidden relative">
            <div className="aspect-video flex flex-col items-center justify-center p-6 relative">
              {/* AI VOICE ANIMATION */}
              <div
                className={`absolute inset-0 ${
                  speaking ? "opacity-30" : "opacity-0"
                } transition-opacity duration-300`}
              >
                {/* Voice wave animation when speaking */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-center items-center h-20">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`mx-1 h-16 w-1 bg-primary rounded-full ${
                        speaking ? "animate-sound-wave" : ""
                      }`}
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        height: speaking ? `${Math.random() * 50 + 20}%` : "5%",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* AI IMAGE */}
              <div className="relative size-32 mb-4">
                <div
                  className={`absolute inset-0 bg-primary opacity-10 rounded-full blur-lg ${
                    speaking ? "animate-pulse" : ""
                  }`}
                />

                <div className="relative w-full h-full rounded-full bg-card flex items-center justify-center border border-border overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-secondary/10"></div>
                  <img
                    src="/ai-avatar.png"
                    alt="AI Assistant"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground">GenX_AI</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Personalized Trainer and Nutrition Expert
              </p>

              {/* SPEAKING INDICATOR */}

              <div
                className={`mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border ${
                  speaking ? "border-primary" : ""
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    speaking ? "bg-primary animate-pulse" : "bg-muted"
                  }`}
                />

                <span className="text-xs text-muted-foreground">
                  {speaking
                    ? "Speaking..."
                    : activeCall
                      ? "Listening..."
                      : callEnded
                        ? "Redirecting to profile..."
                        : "Waiting..."}
                </span>
              </div>
            </div>
          </Card>

          {/*User card */}
          <Card
            className={`bg-card/90 backdrop-blur-sm border overflow-hidden relative`}
          >
            <div className="aspect-video flex flex-col items-center justify-center p-6 relative">
              {/* User Image */}
              <div className="relative size-32 mb-4">
                <img
                  src={user?.imageUrl}
                  alt="User"
                  // ADD THIS "size-full" class to make it rounded on all images
                  className="size-full object-cover rounded-full"
                />
              </div>

              <h2 className="text-xl font-bold text-foreground">
                You
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {user
                  ? (user.firstName + " " + (user.lastName || "")).trim()
                  : "Guest"}
              </p>

              {/* User Ready Text */}
              <div
                className={`mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border`}
              >
                <div className={`w-2 h-2 rounded-full bg-muted`} />
                <span className="text-xs text-muted-foreground">Ready</span>
              </div>
            </div>
          </Card>
        </div>

         {/*Message Container*/}
         {message.length >0 &&(
          <div ref={msgContainerRef} className="w-full bg-card/90 backdrop-blur-sm border border-border rounded-xl p-4 mb-8 h-64 overflow-y-auto
          transition-all duration-300 scroll-smooth">
            <div className="space-y-3">
              {message.map((msg, index)=>(
                <div className="message-item animate-fadeIn" key={index}>
                  <div className="font-semibold text-xs text-muted-foreground mb-1">
                    {msg.role === "assistant" ? "GenX_AI" : "You"}
                  </div>
                  <p className="text-foreground">{msg.content}</p>
                </div>
              ))}
               {callEnded && (
                <div className="message-item animate-fadeIn">
                  <div className="font-semibold text-xs text-primary mb-1">System:</div>
                  <p className="text-foreground">
                    Your fitness program has been created! Redirecting to your profile...
                  </p>
                </div>
              )}
            </div>
          </div>
         )}
         {/*Call Controls*/}
          <div className="w-full flex justify-center gap-4">
            <Button
              className={`w-40 text-xl rounded-3xl ${activeCall ? "bg-destructive hover:bg-destructive/90" : callEnded ? "bg-green-500 hover:bg-green-700" : "bg-primary hover:bg-primary/90"} text-white relative`}
              onClick={startCall}
              disabled={connecting||callEnded}>
                {connecting &&(<span className="absolute inset-0 rounded-full animate-ping bg-primary/50 opacity-75"></span>)}
                <span>
                  {activeCall ? "End call" : connecting?"Connecting":callEnded?"Visit Profile": "Start call"}
                </span>
                
              </Button>
          </div>

      </div>
    </div>
  );
};

export default GenerateProgram;
