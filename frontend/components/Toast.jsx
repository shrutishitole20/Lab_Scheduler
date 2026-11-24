'use client';

export default function Toast({ toast, onClose }) {
  if (!toast || !toast.show) return null;

  return (
    <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1090 }}>
      <div className="toast show align-items-center text-bg-dark border-0 shadow-lg" role="alert">
        <div className="d-flex">
          <div className="toast-body">
            {toast.message}
          </div>
          <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={onClose}></button>
        </div>
      </div>
    </div>
  );
}
