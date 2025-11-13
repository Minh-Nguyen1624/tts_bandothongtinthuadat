// // Import polyfills first
// import "./polyfills";

// import React, { useEffect, useRef } from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App";
// import { ThemeProvider } from "../Context/Provider";

// // Component ShareModal với xử lý lỗi từ extension
// const ShareModal = () => {
//   const modalRef = useRef(null);

//   useEffect(() => {
//     const modalElement = modalRef.current;
//     if (modalElement) {
//       const handleClick = (e) => {
//         // console.log("Modal clicked", e.target);
//       };

//       // Thêm try-catch để xử lý lỗi từ extension
//       try {
//         modalElement.addEventListener("click", handleClick);
//       } catch (error) {
//         console.warn("⚠️ Lỗi khi thêm event listener:", error);
//       }

//       // Cleanup
//       return () => {
//         try {
//           modalElement.removeEventListener("click", handleClick);
//         } catch (error) {
//           console.warn("⚠️ Lỗi khi cleanup event listener:", error);
//         }
//       };
//     } else {
//       console.warn(
//         "⚠️ Phần tử modalRef.current là null, có thể do extension can thiệp"
//       );
//     }
//   }, []); // Chạy một lần sau mount

//   return (
//     <div ref={modalRef} id="share-modal">
//       This is a modal
//     </div>
//   );
// };

// const setupGlobalMediaErrorHandling = () => {
//   window.addEventListener("unhandledrejection", (event) => {
//     if (event.reason && event.reason.name === "AbortError") {
//       // console.log("Media request was aborted");
//       event.preventDefault();
//       event.stopPropagation();
//     }
//   });

//   window.addEventListener("error", (event) => {
//     if (event.error && event.error.name === "AbortError") {
//       // console.log("Media AbortError caught globally");
//       event.preventDefault();
//     }
//   });
// };

// // 🚨 Xử lý lỗi từ extension (bao gồm React Developer Tools)
// window.addEventListener(
//   "error",
//   (event) => {
//     const file = event.filename || "";
//     const message = event.message || "";
//     if (
//       file.includes("chrome-extension://") ||
//       file.includes("share-modal.js") ||
//       message.includes("React") // Phát hiện lỗi liên quan React DevTools
//     ) {
//       console.warn("⛔ Extension hoặc React DevTools gây lỗi:", {
//         file,
//         message,
//         stack: event.error?.stack,
//       });
//       event.preventDefault();
//       event.stopPropagation();
//     }
//   },
//   true
// );

// // 🚨 Xử lý unhandledrejection
// window.addEventListener(
//   "unhandledrejection",
//   (event) => {
//     const reason = event.reason?.stack || "";
//     if (
//       reason.includes("chrome-extension://") ||
//       reason.includes("share-modal.js") ||
//       reason.includes("React")
//     ) {
//       console.warn("⛔ Extension promise bị chặn:", reason);
//       event.preventDefault();
//       event.stopPropagation();
//     }
//   },
//   true
// );

// // Setup global error handling
// setupGlobalMediaErrorHandling();

// // 🚀 Render App
// const rootElement = document.getElementById("root");
// if (rootElement) {
//   ReactDOM.createRoot(rootElement).render(
//     <React.StrictMode>
//       <ThemeProvider>
//         <App>
//           <ShareModal />
//         </App>
//       </ThemeProvider>
//     </React.StrictMode>
//   );
// } else {
//   console.error("❌ Phần tử #root không tồn tại trong DOM!");
// }

// Import polyfills first
import "./polyfills";

import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "../Context/Provider";

// Component ShareModal
const ShareModal = () => {
  const modalRef = useRef(null);

  useEffect(() => {
    const modalElement = modalRef.current;
    if (modalElement) {
      const handleClick = () => {};

      try {
        modalElement.addEventListener("click", handleClick);
      } catch (error) {
        console.warn("Lỗi thêm event listener:", error);
      }

      return () => {
        try {
          modalElement.removeEventListener("click", handleClick);
        } catch (error) {
          console.warn("Lỗi cleanup event listener:", error);
        }
      };
    }
  }, []);

  return (
    <div ref={modalRef} id="share-modal">
      This is a modal
    </div>
  );
};

// Global error handling
const setupGlobalErrorHandling = () => {
  // Bắt AbortError
  window.addEventListener("unhandledrejection", (event) => {
    if (event.reason?.name === "AbortError") {
      event.preventDefault();
    }
  });

  window.addEventListener("error", (event) => {
    if (event.error?.name === "AbortError") {
      event.preventDefault();
    }
  });

  // Bắt lỗi từ extension
  window.addEventListener(
    "error",
    (event) => {
      const file = event.filename || "";
      const message = event.message || "";
      if (
        file.includes("chrome-extension://") ||
        file.includes("react_devtools") ||
        message.includes("React")
      ) {
        console.warn("Extension gây lỗi:", { file, message });
        event.preventDefault();
      }
    },
    true
  );

  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const reason = event.reason?.stack || "";
      if (reason.includes("chrome-extension://") || reason.includes("React")) {
        console.warn("Promise bị chặn bởi extension:", reason);
        event.preventDefault();
      }
    },
    true
  );
};

// Tắt React DevTools (tùy chọn)
if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ === "object") {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = function () {};
}

// Setup
setupGlobalErrorHandling();

// Render khi DOM sẵn sàng
const rootElement = document.getElementById("root");
if (rootElement) {
  const renderApp = () => {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ThemeProvider>
          <App>
            <ShareModal />
          </App>
        </ThemeProvider>
      </React.StrictMode>
    );
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderApp);
  } else {
    renderApp();
  }
} else {
  console.error("Phần tử #root không tồn tại!");
}
