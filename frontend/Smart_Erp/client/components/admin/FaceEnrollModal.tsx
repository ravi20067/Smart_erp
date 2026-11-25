import { useState, useEffect, useRef } from "react";
import { Camera, CheckCircle2, XCircle, Upload, ShieldCheck, Trash2, Loader2, X, Video, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { adminFaceService, type FaceStatusResponse } from "@/services/adminFaceService";

interface FaceEnrollModalProps {
  studentId: number;
  studentName: string;
  rollNumber?: string;
  isOpen: boolean;
  onClose: () => void;
  onEnrolled?: () => void;
}

export default function FaceEnrollModal({
  studentId,
  studentName,
  rollNumber,
  isOpen,
  onClose,
  onEnrolled,
}: FaceEnrollModalProps) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [status, setStatus] = useState<FaceStatusResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Live Super Admin Webcam Capture state
  const [webcamActive, setWebcamActive] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const clearCapturedPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setCapturedPreview(null);
    setCapturedBlob(null);
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setWebcamActive(false);
  };

  useEffect(() => {
    if (isOpen && studentId) {
      setConfirmDelete(false);
      loadStatus();
    } else {
      stopWebcam();
      clearCapturedPreview();
      setSelectedFile(null);
      setConfirmDelete(false);
    }
    return () => {
      stopWebcam();
      clearCapturedPreview();
    };
  }, [isOpen, studentId]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await adminFaceService.getFaceStatus(studentId);
      setStatus(data);
    } catch (e: any) {
      console.error(e);
      toast.error("Could not fetch face biometric status");
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollFromProfilePhoto = async () => {
    setActionLoading(true);
    try {
      const res = await adminFaceService.enrollFaceFromPhoto(studentId);
      toast.success(res.message || "Face biometrics enrolled from registered photo!");
      await loadStatus();
      if (onEnrolled) onEnrolled();
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Enrollment failed. Face not detected in photo.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnrollWithCustomFile = async () => {
    if (!selectedFile) return;
    setActionLoading(true);
    try {
      const res = await adminFaceService.enrollFaceWithFile(studentId, selectedFile);
      toast.success(res.message || "Face biometric template registered successfully!");
      setSelectedFile(null);
      await loadStatus();
      if (onEnrolled) onEnrolled();
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Failed to extract face embedding from uploaded file.");
    } finally {
      setActionLoading(false);
    }
  };

  const startWebcam = async () => {
    clearCapturedPreview();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setWebcamActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch {
      toast.error("Unable to access webcam for supervised face capture.");
    }
  };

  const captureFromWebcam = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      toast.error("Camera feed not ready yet.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        clearCapturedPreview();
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setCapturedBlob(blob);
        setCapturedPreview(url);
        stopWebcam();
      }
    }, "image/jpeg", 0.92);
  };

  const handleEnrollCapturedFrame = async () => {
    if (!capturedBlob) return;
    setActionLoading(true);
    try {
      const file = new File([capturedBlob], `admin_capture_${studentId}.jpg`, { type: "image/jpeg" });
      const res = await adminFaceService.enrollFaceWithFile(studentId, file);
      toast.success(res.message || "Face biometrics enrolled from live webcam capture!");
      clearCapturedPreview();
      await loadStatus();
      if (onEnrolled) onEnrolled();
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Captured face failed quality or detection checks.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTemplate = async () => {
    setActionLoading(true);
    try {
      const res = await adminFaceService.deleteFaceTemplate(studentId);
      toast.success(res.message);
      setConfirmDelete(false);
      await loadStatus();
      if (onEnrolled) onEnrolled();
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Failed to remove face template.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Face Biometric Management</h2>
              <p className="text-xs text-slate-400">Super Admin Security Authority • 128-D SFace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Student Info */}
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs text-slate-400">Student Profile</p>
          <p className="text-base font-bold text-white">{studentName}</p>
          <p className="text-xs text-slate-400 font-mono">
            Student ID: {studentId} {rollNumber ? `• Roll: ${rollNumber}` : ""}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {loading ? (
              <Loader2 size={16} className="animate-spin text-cyan-400" />
            ) : status?.hasEnrolledFace ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                <CheckCircle2 size={14} /> Biometric Enrolled ({status.dimension || 128}-D {status.algorithm || "SFACE"})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
                <XCircle size={14} /> Face Template Not Registered
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-5 space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {/* Method 1: Enroll from Registered Photo */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/30 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Method 1: Instant Profile Photo Extraction
            </h4>
            <p className="mt-1 text-xs text-slate-400">
              Extract 128-d AI vector directly from the student&apos;s registered ERP passport photograph.
            </p>
            <button
              onClick={handleEnrollFromProfilePhoto}
              disabled={actionLoading || !status?.hasProfilePhoto}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-cyan-500/20 hover:brightness-110 disabled:opacity-50"
            >
              {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              {status?.hasProfilePhoto ? "Enroll from Registered Photo" : "No Registered Photo on File"}
            </button>
          </div>

          {/* Method 2: Live Supervised Webcam Capture */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/30 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Method 2: Live Supervised Desk Capture
            </h4>
            <p className="mt-1 text-xs text-slate-400">
              Capture student&apos;s front-facing portrait directly from the admin desk webcam.
            </p>

            {webcamActive && (
              <div className="mt-3 space-y-2">
                <div className="relative h-48 w-full overflow-hidden rounded-xl border border-cyan-500/40 bg-black">
                  <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover -scale-x-100" />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={captureFromWebcam}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
                  >
                    <Camera size={14} /> Capture Portrait
                  </button>
                  <button
                    type="button"
                    onClick={stopWebcam}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300"
                  >
                    <StopCircle size={14} /> Cancel Camera
                  </button>
                </div>
              </div>
            )}

            {!webcamActive && capturedPreview && (
              <div className="mt-3 space-y-2">
                <img src={capturedPreview} alt="Captured student face" className="h-40 w-40 rounded-xl object-cover border border-emerald-500/40" />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleEnrollCapturedFrame}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Confirm &amp; Register Embedding
                  </button>
                  <button
                    type="button"
                    onClick={startWebcam}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300"
                  >
                    Retake
                  </button>
                </div>
              </div>
            )}

            {!webcamActive && !capturedPreview && (
              <button
                type="button"
                onClick={startWebcam}
                disabled={actionLoading}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20"
              >
                <Video size={14} /> Open Webcam Capture
              </button>
            )}
          </div>

          {/* Method 3: Upload Dedicated Face Photo */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/30 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Method 3: Upload High-Resolution Portrait
            </h4>
            <p className="mt-1 text-xs text-slate-400">
              Upload a clear front-facing image (JPEG/PNG) to extract and encrypt biometric features.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-400 file:mr-2 file:rounded-xl file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-200"
              />
              {selectedFile && (
                <button
                  onClick={handleEnrollWithCustomFile}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Upload &amp; Enroll
                </button>
              )}
            </div>
          </div>

          {/* Remove / Reset Face Template */}
          {status?.hasEnrolledFace && (
            <div className="pt-2">
              {confirmDelete ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs">
                  <span className="text-rose-200 font-medium">
                    Confirm removal of this student&apos;s face biometric template?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={actionLoading}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteTemplate}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      Confirm Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20"
                  >
                    <Trash2 size={14} /> Remove Enrolled Face Template
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}