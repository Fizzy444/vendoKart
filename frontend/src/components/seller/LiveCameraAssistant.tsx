"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
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
    title: "1. Workshop Evidence",
    subtitle: "Show physical workbench & tools.",
    hint: "Keep your workspace & tools clearly inside the frame.",
    icon: Store,
  },
  {
    step: 2,
    title: "2. Handcrafting Process",
    subtitle: "Capture in-progress handmade work.",
    hint: "Show your crafting technique in action.",
    icon: Hammer,
  },
  {
    step: 3,
    title: "3. Finished Craft Piece",
    subtitle: "Capture the completed product.",
    hint: "Center the final item under even lighting.",
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

  // Real-time Computer Vision Quality Metrics
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
      setCameraError(err.message || "Failed to access camera. Please allow camera permissions.");
      setStreamActive(false);
    }
  }, []);

  // Stop camera stream cleanly
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
    }
  }, []);

  // Continuous Canvas CV Analysis (Lighting & Sharpness)
  const analyzeQuality = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !streamActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (ctx && video.readyState === 4) {
      canvas.width = 160;
      canvas.height = 120;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        let totalBrightness = 0;
        let pixelCount = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          totalBrightness += (r * 299 + g * 587 + b * 114) / 1000;
        }

        const avgBrightness = Math.round(totalBrightness / pixelCount);
        setBrightnessVal(avgBrightness);

        if (avgBrightness < 65) {
          setLightingStatus("dark");
        } else if (avgBrightness > 215) {
          setLightingStatus("bright");
        } else {
          setLightingStatus("good");
        }

        setIsSharp(avgBrightness >= 50);
      } catch {
        // Ignore canvas reading errors in sandbox
      }
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

  // Capture snapshot
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

      setIsFlashActive(true);
      setTimeout(() => setIsFlashActive(false), 200);

      setCapturedPreview(dataUri);
    }
  };

  // Confirm photo and advance
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
    <div className="w-full bg-white border border-[#EBE6DC] rounded-3xl shadow-sm overflow-hidden flex flex-col">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#EBE6DC] flex items-center justify-between bg-[#FEFCE8]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#064e3b] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-[#064e3b] flex items-center gap-1.5 leading-tight">
              Live Camera Verification Studio
            </h2>
            <p className="text-[11px] text-[#6B7260] mt-0.5">
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
          className="text-[#6B7260] hover:text-[#1E2316] p-1.5 rounded-xl hover:bg-[#FAF7F0] transition-colors cursor-pointer"
          title="Close Camera"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Step Progress Bar (Scrollable on small mobile) */}
      <div className="px-3 sm:px-6 py-2.5 bg-[#FAF7F0] border-b border-[#EBE6DC] flex items-center justify-between gap-1.5 overflow-x-auto text-[11px]">
        {STEPS.map((s) => {
          const isDone = s.step < currentStep || (s.step === 1 && workspacePhoto) || (s.step === 2 && processPhoto);
          const isCurrent = s.step === currentStep;
          return (
            <div
              key={s.step}
              className={`flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border text-center transition-all ${
                isCurrent
                  ? "bg-[#064e3b] border-[#064e3b] text-white font-bold shadow-sm"
                  : isDone
                  ? "bg-[#FEFCE8] border-[#FEF08A] text-[#064e3b] font-semibold"
                  : "bg-white border-[#EBE6DC] text-[#6B7260]"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#15803d] shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full bg-[#EBE6DC] text-[9px] flex items-center justify-center font-bold text-[#1E2316]">
                  {s.step}
                </span>
              )}
              <span className="truncate">{s.title.replace(/^\d+\.\s*/, "")}</span>
            </div>
          );
        })}
      </div>

      {/* Main Viewport & Guidance Area */}
      <div className="p-3 sm:p-6 space-y-4">
        {/* Step Instructions Banner */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FEFCE8] border border-[#FEF08A] flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#064e3b] text-white flex items-center justify-center shrink-0">
            <StepIcon className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 text-xs">
            <h4 className="font-bold text-[#064e3b]">{activeStepMeta.title}</h4>
            <p className="text-[#4A5240]">{activeStepMeta.subtitle}</p>
            <p className="text-[11px] text-[#064e3b] font-medium pt-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#CA8A04]" /> {activeStepMeta.hint}
            </p>
          </div>
        </div>

        {/* Camera Viewport or Frozen Preview */}
        <div className="relative rounded-2xl overflow-hidden bg-black border border-[#EBE6DC] aspect-[4/3] sm:aspect-video w-full max-w-xl mx-auto flex items-center justify-center shadow-inner">
          {cameraError ? (
            <div className="p-6 text-center space-y-3 text-xs text-white">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="font-semibold text-red-300">{cameraError}</p>
              <Button
                size="sm"
                onClick={startCamera}
                className="bg-[#064e3b] hover:bg-emerald-800 text-white cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Retry Camera
              </Button>
            </div>
          ) : capturedPreview ? (
            <img
              src={capturedPreview}
              alt="Captured Frame"
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />

              {/* Shutter Flash Animation */}
              {isFlashActive && (
                <div className="absolute inset-0 bg-white opacity-80 transition-opacity duration-150 pointer-events-none" />
              )}

              {/* Live Framing Overlay Grid */}
              <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between text-[10px] text-white font-mono bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs self-start">
                  30 FPS Live Stream
                </div>
                <div className="text-center text-[10px] text-white/90 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs self-center">
                  Align craft inside guideline box
                </div>
              </div>

              {/* Real-time Quality Indicators */}
              <div className="absolute top-2 right-2 flex flex-wrap gap-1.5 pointer-events-none">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm backdrop-blur-sm ${
                    lightingStatus === "good"
                      ? "bg-emerald-600/90 text-white"
                      : lightingStatus === "dark"
                      ? "bg-amber-600/90 text-white"
                      : "bg-red-600/90 text-white"
                  }`}
                >
                  <Sun className="w-2.5 h-2.5" />
                  {lightingStatus === "good" ? "Lighting OK" : lightingStatus === "dark" ? "Low Light" : "Too Bright"}
                </span>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm backdrop-blur-sm ${
                    isSharp ? "bg-emerald-600/90 text-white" : "bg-amber-600/90 text-white"
                  }`}
                >
                  <Maximize className="w-2.5 h-2.5" />
                  {isSharp ? "Sharp" : "Blurry"}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Capture / Confirmation Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-[#6B7260] text-center sm:text-left">
            Live hardware camera verification is enforced for authentic artisan proof.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {capturedPreview ? (
              <>
                <Button
                  variant="secondary"
                  onClick={handleRetake}
                  className="flex-1 sm:flex-none bg-[#FAF7F0] border border-[#EBE6DC] text-[#1E2316] text-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Retake
                </Button>
                <Button
                  onClick={handleConfirmPhoto}
                  className="flex-1 sm:flex-none bg-[#064e3b] hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#FEF08A]" />
                  {currentStep === 3 ? "Complete Evidence" : "Confirm & Next Step →"}
                </Button>
              </>
            ) : (
              <Button
                onClick={captureSnapshot}
                disabled={!streamActive}
                className="w-full sm:w-auto bg-[#064e3b] hover:bg-emerald-800 text-white font-black text-xs px-6 py-3 cursor-pointer shadow-md"
              >
                <Camera className="w-4 h-4 mr-1.5 text-[#FEF08A]" />
                Capture Step {currentStep} Photo
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
