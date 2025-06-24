"use client";

import { Card } from "@/components/ui/card";
import { vapi } from "@/lib/vapi";
import { useUser } from "@clerk/nextjs";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const GenerateProgram = () => {
  const [activeCall, setActiveCall] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [message, setMessage] = useState([]);
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
    const handleMessage = (message: msg) => {};
    const handleError = (error: err) => {
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
            <div className="aspect-video flex flex-col items-center justify-center p-6 relative"></div>
          </Card>

          {/*User card */}
          <Card></Card>
        </div>
      </div>
    </div>
  );
};

export default GenerateProgram;
