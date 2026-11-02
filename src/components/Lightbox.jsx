import { useEffect, useRef } from "react";
import { cdn } from "../lib/img";
import { stripTags } from "../lib/format";
import { ArrowL, ArrowR, CloseIcon } from "./Icons";

export default function Lightbox({ images, index, onIndex, onClose }) {
  const ref = useRef(null);
  const open = index != null && images?.[index];
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const k = (e) => {
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, index, images, onIndex]);
  const im = open ? images[index] : null;
  return (
    <dialog ref={ref} className="lightbox" onClose={onClose} aria-label="Image viewer">
      {im && (
        <>
          <button className="iconbtn lightbox-close" onClick={onClose} aria-label="Close viewer" autoFocus><CloseIcon /></button>
          <div className="lightbox-stage"><img src={cdn(im.src, 2500)} alt={im.alt || im.title || ""} /></div>
          <div className="lightbox-bar">
            <button className="iconbtn" onClick={() => onIndex((index - 1 + images.length) % images.length)} aria-label="Previous image"><ArrowL /></button>
            <p className="note" style={{ margin: 0, textAlign: "center", color: "#cfc8bb" }}>
              {im.title || stripTags(im.caption || "")} <span className="faint">{index + 1} / {images.length}</span>
            </p>
            <button className="iconbtn" onClick={() => onIndex((index + 1) % images.length)} aria-label="Next image"><ArrowR /></button>
          </div>
        </>
      )}
    </dialog>
  );
}
