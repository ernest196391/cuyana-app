"use client";

import { useRef, type ChangeEvent } from "react";

type Props = {
  onSelect: (file: File) => void;
  disabled?: boolean;
};

/**
 * Dos botones, no uno: `capture` en un input de archivo hace que algunos
 * navegadores móviles (varios Android) escondan la galería y solo dejen
 * abrir la cámara. Separar el input "solo cámara" del que abre archivos
 * es la única forma de que ambos caminos funcionen siempre.
 */
export default function PhotoPicker({ onSelect, disabled }: Props) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onSelect(file);
  }

  return (
    <div className="admin-photo-picker">
      <button
        type="button"
        className="admin-photo-picker-btn"
        onClick={() => galleryRef.current?.click()}
        disabled={disabled}
        aria-label="Adjuntar desde el celular"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05 12.25 20.24a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.19 9.19a1.5 1.5 0 0 1-2.13-2.12l8.49-8.48" />
        </svg>
        <span>Adjuntar</span>
      </button>
      <button
        type="button"
        className="admin-photo-picker-btn"
        onClick={() => cameraRef.current?.click()}
        disabled={disabled}
        aria-label="Tomar foto con la cámara"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
          <circle cx="12" cy="13.5" r="3.5" />
        </svg>
        <span>Cámara</span>
      </button>
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleChange} disabled={disabled} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleChange} disabled={disabled} />
    </div>
  );
}
