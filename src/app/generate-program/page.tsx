"use client";

import { vapi } from "@/lib/vapi";
import { useUser } from "@clerk/nextjs";
import { error } from "console";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const GenerateProgram = () => {
  const [activeCall, setActiveCall] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [message, setMessage] = useState([]);
  const [callEnded, setCallEnded] = useState(false);

  const {user} = useUser()
  const router = useRouter()

  const msgContainerRef = useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const handleCallStart = () =>{
      console.log("Call started")
      setConnecting(false)
      setActiveCall(true)
      setCallEnded(false)
    }
    const handleCallEnd = () =>{
      console.log("Call ended")
      setActiveCall(false)
      setConnecting(false)
      setSpeaking(false)
      setCallEnded(true)
    }
    const handleSpeechStart = () =>{
      console.log("Speech started")
      setSpeaking(true)
    }
    const handleSpeechEnd = () =>{
      console.log("Speech ended")
      setSpeaking(false)
    }
    const handleMessage = (message: msg)=>{
      
    }
    const handleError = (error: err)=>{
      console.log("Error in vapi connection", error)
      setConnecting(false)
      setActiveCall(false)
    }
    vapi.on("call-start", handleCallStart)
    .on("call-end", handleCallEnd)
    .on("speech-start", handleSpeechStart)
    .on("speech-end", handleSpeechEnd)
    .on("message", handleMessage)
    .on("error", handleError)
    return () =>{
      vapi.off("call-start", handleCallStart)
      vapi.off("call-end", handleCallEnd)
      vapi.off("speech-start", handleSpeechStart)
      vapi.off("message", handleMessage)
      vapi.off("error", handleError)
    }
  },[])
  return (
    <div>

    </div>
  )
}

export default GenerateProgram
