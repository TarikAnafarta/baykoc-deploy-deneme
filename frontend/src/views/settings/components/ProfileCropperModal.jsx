import React from 'react';

export default function ProfileCropperModal({
  modalOpen,
  circleD,
  frameRef,
  maskRef,
  onClose,
  onSave,
  onReselect,
}) {
  if (!modalOpen) return null;

  return (
    <div
      id="cropper-overlay"
      className="fixed inset-0 z-50 p-4 flex items-center justify-center bg-black/60"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="px-4 py-3 font-semibold text-gray-800">Profil Fotoğrafını Güncelle</div>
        <div className="px-4 pb-4">
          <div
            id="crop-frame"
            className="mx-auto relative bg-gray-800 rounded-lg overflow-hidden w-full max-w-[560px]"
            ref={frameRef}
            style={{ height: `${circleD}px` }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div
                className="relative rounded-full overflow-hidden"
                style={{ width: `${circleD}px`, height: `${circleD}px` }}
              >
                <img
                  id="crop-image"
                  alt="crop"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transformOrigin: 'center center',
                    zIndex: 10,
                    willChange: 'transform',
                    userSelect: 'none',
                    WebkitUserDrag: 'none',
                    pointerEvents: 'auto',
                  }}
                />
              </div>
              <div
                id="circle-mask"
                className="absolute rounded-full pointer-events-none"
                ref={maskRef}
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: `${circleD}px`,
                  height: `${circleD}px`,
                  boxShadow: '0 0 0 2000px rgba(0,0,0,0.55)',
                  border: '2px dashed var(--color-positive)',
                  zIndex: 30,
                }}
              ></div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <label htmlFor="zoom-range" className="text-sm text-gray-600 w-24">
                Yakınlaştır
              </label>
              <input
                id="zoom-range"
                type="range"
                min="100"
                max="300"
                defaultValue="130"
                className="flex-1"
              />
              <span id="zoom-label" className="w-12 text-right text-sm text-gray-600">
                130%
              </span>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              id="reselect-btn"
              type="button"
              className="px-3 py-2 rounded-md bg-green-50 text-green-700 border border-green-200"
              onClick={onReselect}
            >
              📤 Dosya Seç
            </button>
            <button
              id="cancel-crop-btn"
              type="button"
              className="px-3 py-2 rounded-md bg-gray-100 text-gray-700"
              onClick={onClose}
            >
              İptal
            </button>
            <button
              id="save-crop-btn"
              type="button"
              className="px-3 py-2 rounded-md bg-green-600 text-white"
              onClick={onSave}
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
