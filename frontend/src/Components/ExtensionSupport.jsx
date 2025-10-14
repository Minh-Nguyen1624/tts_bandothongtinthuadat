import { useEffect } from "react";

const ExtensionSupport = () => {
  useEffect(() => {
    // Tạo mock elements cho extensions
    const mockElements = {
      "share-button": { click: () => console.log("Share clicked") },
      "share-modal": { style: { display: "none" } },
      "mainlog-rate": { remove: () => console.log("Rate removed") },
    };

    // Mock document.getElementById
    const originalGetElementById = document.getElementById;
    document.getElementById = function (id) {
      if (mockElements[id]) {
        return mockElements[id];
      }
      return originalGetElementById.call(this, id);
    };

    // Mock querySelector
    const originalQuerySelector = document.querySelector;
    document.querySelector = function (selector) {
      if (selector.includes("share")) {
        return mockElements["share-button"];
      }
      return originalQuerySelector.call(this, selector);
    };

    return () => {
      // Restore original functions
      document.getElementById = originalGetElementById;
      document.querySelector = originalQuerySelector;
    };
  }, []);

  return null; // Component không render gì
};

export default ExtensionSupport;
