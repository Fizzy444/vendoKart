"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Sun,
  Maximize,
  X,
  Hammer,
  Store,
  Award,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export interface LiveCapturedEvidence {
  workspace_photo: string;
  process_photo: string;
  finished_product_photo: string;
}

interface LiveCameraAssistantProps {
  onComplete: (evidence: LiveCapturedEvidence) => void;
  onCancel: () => void;
}

type CaptureStep = 1 | 2 | 3;

interface StepInfo {
  step: CaptureStep;
  title: string;
  subtitle: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepInfo[] = [
  {
    step: 1,
    title: "1. Workshop & Workspace Evidence",
    subtitle: "Show your physical craft venue, workbench, and authentic artisan tools.",
    hint: "Position your workshop, tools, and work surface inside the frame.",
    icon: Store,
  },
  {
    step: 2,
    title: "2. Active Crafting Process Evidence",
    subtitle: "Capture in-progress handmade work (hands at work, raw materials being shaped).",
    hint: "Show the technique in action (weaving, carving, shaping clay, stitching).",
    icon: Hammer,
  },
  {
    step: 3,
    title: "3. Finished Handcrafted Piece",
    subtitle: "Capture the completed, high-quality craft item ready for buyers.",
    hint: "Center the final finished item under clear, even lighting.",
    icon: Award,
  },
];

export function LiveCameraAssistant({ onComplete, onCancel }: LiveCameraAssistantProps) {
  const [currentStep, setCurrentStep] = useState<CaptureStep>(1);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Captured Photos
  const [workspacePhoto, setWorkspacePhoto] = useState<string | null>(null);
  const [processPhoto, setProcessPhoto] = useState<string | null>(null);
  const [finishedPhoto, setFinishedPhoto] = useState<string | null>(null);

  // Current Step Preview
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  // Real-time Computer Vision Quality Metrics (§13)
  const [brightnessVal, setBrightnessVal] = useState<number>(128);
  const [lightingStatus, setLightingStatus] = useState<"dark" | "good" | "bright">("good");
  const [isSharp, setIsSharp] = useState<boolean>(true);
  const [isFlashActive, setIsFlashActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported on this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
      }
    } catch (err: any) {
      console.warn("Environmental camera failed, falling back to default camera:", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStreamActive(true);
        }
      } catch (fallbackErr: any) {
        setCameraError(
          fallbackErr.message ||
            "Unable to access your device camera. Please check camera permissions in browser settings."
        );
        setStreamActive(false);
      }
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
    }
    setStreamActive(false);
  }, []);

  // Real-time quality analyzer loop (§13 Product Photography Assistant)
  const analyzeQuality = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !streamActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = 160; // downsampled for fast 30fps analysis
      canvas.height = 120;
      ctx.drawImage(video, 0, 0, 160, 120);

      const frame = ctx.getImageData(0, 0, 160, 120);
      const data = frame.data;
      let totalLuma = 0;
      let diffSum = 0;

      for (let i = 0; i < data.length; i += 4) {
        // Luminance calculation
        const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        totalLuma += luma;

        // Neighbor gradient comparison for sharpness estimation
        if (i > 4) {
          const prevLuma =
            0.299 * data[i - 4] + 0.587 * data[i - 3] + 0.114 * data[i - 2];
          diffSum += Math.abs(luma - prevLuma);
        }
      }

      const pixelCount = data.length / 4;
      const avgLuma = totalLuma / pixelCount;
      const avgGradient = diffSum / pixelCount;

      setBrightnessVal(Math.round(avgLuma));
      if (avgLuma < 50) {
        setLightingStatus("dark");
      } else if (avgLuma > 225) {
        setLightingStatus("bright");
      } else {
        setLightingStatus("good");
      }

      setIsSharp(avgGradient > 8.5);
    }

    animFrameId.current = requestAnimationFrame(analyzeQuality);
  }, [streamActive]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (streamActive) {
      animFrameId.current = requestAnimationFrame(analyzeQuality);
    }
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [streamActive, analyzeQuality]);

  // Capture current frame from video stream
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const snapCanvas = document.createElement("canvas");
    snapCanvas.width = video.videoWidth || 1280;
    snapCanvas.height = video.videoHeight || 720;
    const snapCtx = snapCanvas.getContext("2d");

    if (snapCtx) {
      snapCtx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
      const dataUri = snapCanvas.toDataURL("image/jpeg", 0.85);

      // Trigger shutter flash
      setIsFlashActive(true);
      setTimeout(() => setIsFlashActive(false), 200);

      setCapturedPreview(dataUri);
    }
  };

  // Confirm current step's photo and advance
  const handleConfirmPhoto = () => {
    if (!capturedPreview) return;

    if (currentStep === 1) {
      setWorkspacePhoto(capturedPreview);
      setCapturedPreview(null);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setProcessPhoto(capturedPreview);
      setCapturedPreview(null);
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setFinishedPhoto(capturedPreview);
      // All 3 steps complete
      stopCamera();
      onComplete({
        workspace_photo: workspacePhoto || capturedPreview,
        process_photo: processPhoto || capturedPreview,
        finished_product_photo: capturedPreview,
      });
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
  };

  const activeStepMeta = STEPS[currentStep - 1];
  const StepIcon = activeStepMeta.icon;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in duration-200">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-artisan-500/10 text-artisan-400 flex items-center justify-center border border-artisan-500/20 shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Live Camera Verification Studio
              <Badge variant="primary" size="sm">
                §12 Live Capture
              </Badge>
            </h2>
            <p className="text-xs text-slate-400">
              Step {currentStep} of 3 — {activeStepMeta.title}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            stopCamera();
            onCancel();
          }}
          className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition-colors"
          title="Close Camera"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Step Progress Bar */}
      <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
        {STEPS.map((s) => {
          const isDone = s.step < currentStep || (s.step === 1 && workspacePhoto) || (s.step === 2 && processPhoto);
          const isCurrent = s.step === currentStep;
          return (
            <div
              key={s.step}
              className={`flex-1 flex items-center gap-2 py-1.5 px-3 rounded-xl border transition-all ${
                isCurrent
                  ? "bg-artisan-500/10 border-artisan-500/40 text-artisan-300 font-semibold"
                  : isDone
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-900 border-slate-800 text-slate-500"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold">
                  {s.step}
                </span>
              )}
              <span className="truncate hidden sm:inline">{s.title.replace(/^\d+\.\s*/, "")}</span>
            </div>
          );
        })}
      </div>

      {/* Main Viewport & Guidance Area */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Step Instructions Banner */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-artisan-500/10 text-artisan-400 flex items-center justify-center shrink-0 border border-artisan-500/20">
            <StepIcon className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-200">{activeStepMeta.title}</h4>
            <p className="text-xs text-slate-400">{activeStepMeta.subtitle}</p>
            <p className="text-[11px] text-artisan-400 font-medium pt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Tip: {activeStepMeta.hint}
            </p>
          </div>
        </div>

        {/* Camera Viewport or Frozen Preview */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 aspect-video max-w-2xl mx-auto flex items-center justify-center shadow-2xl">
          {cameraError ? (
            <div className="p-6 text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-xs text-slate-300 max-w-sm">{cameraError}</p>
              <Button size="sm" variant="secondary" onClick={startCamera} className="text-xs">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
              </Button>
            </div>
          ) : capturedPreview ? (
            /* Review Captured Photo */
            <div className="relative w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedPreview}
                alt="Captured Step"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3">
                <Badge variant="success" size="sm">
                  ✓ Photo Captured
                </Badge>
              </div>
            </div>
          ) : (
            /* Live Camera Stream */
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />

              {/* Shutter flash animation */}
              {isFlashActive && (
                <div className="absolute inset-0 bg-white opacity-80 animate-out fade-out duration-200 pointer-events-none" />
              )}

              {/* Photography Assistant Framing Grid HUD (§13) */}
              <div className="absolute inset-0 pointer-events-none border-2 border-slate-700/50 m-6 rounded-2xl">
                {/* Center Crosshairs */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border border-artisan-400/40 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-artisan-400/80 rounded-full" />
                  </div>
                </div>

                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-artisan-400" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-artisan-400" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-artisan-400" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-artisan-400" />
              </div>

              {/* Real-time Quality Badges (§13 Real-time Feedback) */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-2 pointer-events-none">
                <div
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold backdrop-blur-md border flex items-center gap-1.5 ${
                    lightingStatus === "good"
                      ? "bg-slate-950/80 text-emerald-400 border-emerald-500/30"
                      : "bg-slate-950/85 text-amber-400 border-amber-500/30"
                  }`}
                >
                  <Sun className="w-3 h-3" />
                  {lightingStatus === "good"
                    ? "Good Lighting"
                    : lightingStatus === "dark"
                    ? "Too Dark — Move to light"
                    : "Harsh Lighting / Glare"}
                </div>

                <div
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold backdrop-blur-md border flex items-center gap-1.5 ${
                    isSharp
                      ? "bg-slate-950/80 text-emerald-400 border-emerald-500/30"
                      : "bg-slate-950/85 text-amber-400 border-amber-500/30"
                  }`}
                >
                  <Maximize className="w-3 h-3" />
                  {isSharp ? "Sharp Focus" : "Hold Steady"}
                </div>
              </div>

              {/* Live Badge */}
              <div className="absolute bottom-3 left-3 bg-red-500/90 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE CAMERA
              </div>
            </div>
          )}
        </div>

        {/* Capture / Review Action Bar */}
        <div className="flex items-center justify-center gap-4">
          {capturedPreview ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRetake}
                className="text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retake Photo
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmPhoto}
                className="text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {currentStep === 3 ? "Complete All 3 Captures" : "Save & Continue to Step " + (currentStep + 1)}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="lg"
              disabled={!streamActive}
              onClick={captureSnapshot}
              className="bg-artisan-500 hover:bg-artisan-600 text-slate-950 font-bold rounded-full px-8 shadow-xl shadow-artisan-500/20 hover:scale-105 transition-all text-xs"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture {activeStepMeta.title.replace(/^\d+\.\s*/, "")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
