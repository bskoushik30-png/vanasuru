import { X } from "lucide-react";
import { useEffect } from "react";

export function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-[color:var(--forest-deep)]/95 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-6 right-6 text-ivory hover:text-[color:var(--gold)] p-2"
      >
        <X size={24} />
      </button>
      <img src={src} alt="" className="max-h-[90vh] max-w-[90vw] object-contain" />
    </div>
  );
}
