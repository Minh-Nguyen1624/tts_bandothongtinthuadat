import React, { useEffect, useRef, useContext } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "../Context/Provider";

// Component ShareModal với xử lý lỗi từ extension
const ShareModal = () => {
  const modalRef = useRef(null);

  useEffect(() => {
    const modalElement = modalRef.current;
    if (modalElement) {
      const handleClick = (e) => {
        console.log("Modal clicked", e.target);
      };

      // Thêm try-catch để xử lý lỗi từ extension
      try {
        modalElement.addEventListener("click", handleClick);
      } catch (error) {
        console.warn("⚠️ Lỗi khi thêm event listener:", error);
      }

      // Cleanup
      return () => {
        try {
          modalElement.removeEventListener("click", handleClick);
        } catch (error) {
          console.warn("⚠️ Lỗi khi cleanup event listener:", error);
        }
      };
    } else {
      console.warn(
        "⚠️ Phần tử modalRef.current là null, có thể do extension can thiệp"
      );
    }
  }, []); // Chạy một lần sau mount

  return (
    <div ref={modalRef} id="share-modal">
      This is a modal
    </div>
  );
};

// 🚨 Xử lý lỗi từ extension (bao gồm React Developer Tools)
window.addEventListener(
  "error",
  (event) => {
    const file = event.filename || "";
    const message = event.message || "";
    if (
      file.includes("chrome-extension://") ||
      file.includes("share-modal.js") ||
      message.includes("React") // Phát hiện lỗi liên quan React DevTools
    ) {
      console.warn("⛔ Extension hoặc React DevTools gây lỗi:", {
        file,
        message,
        stack: event.error?.stack,
      });
      event.preventDefault();
      event.stopPropagation();
    }
  },
  true
);

// 🚨 Xử lý unhandledrejection
window.addEventListener(
  "unhandledrejection",
  (event) => {
    const reason = event.reason?.stack || "";
    if (
      reason.includes("chrome-extension://") ||
      reason.includes("share-modal.js") ||
      reason.includes("React")
    ) {
      console.warn("⛔ Extension promise bị chặn:", reason);
      event.preventDefault();
      event.stopPropagation();
    }
  },
  true
);

// 🚀 Render App
const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {/* <App>
        <ShareModal />
      </App> */}
      <ThemeProvider>
        <App>
          <ShareModal />
        </App>
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
  console.error("❌ Phần tử #root không tồn tại trong DOM!");
}
