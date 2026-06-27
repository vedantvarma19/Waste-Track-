// frontend/src/components/Toast.jsx
import React, { useEffect } from "react";

const Toast = ({ message, type = "success", onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  if (!message) return null;

  return (
    <div className={`toast ${type === "error" ? "toast-error" : ""}`}>
      <span>{type === "error" ? "⛔️" : "✨"}</span>
      <div>{message}</div>
      <button 
        onClick={onClose} 
        style={{ 
          background: "transparent", 
          border: "none", 
          color: "white", 
          cursor: "pointer", 
          marginLeft: "1rem",
          fontWeight: "bold",
          fontSize: "1.1rem" 
        }}
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
