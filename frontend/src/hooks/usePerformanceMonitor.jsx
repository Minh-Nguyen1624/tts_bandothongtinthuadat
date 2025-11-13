import { useEffect, useRef } from "react";

export const usePerformanceMonitor = (componentName, options = {}) => {
  const {
    warnOnMountTime = 100,
    warnOnReRenderCount = 10,
    enabled = process.env.NODE_ENV === "development",
  } = options;

  const mountTime = useRef(performance.now());
  const renderCount = useRef(0);
  const componentId = useRef(Math.random().toString(36).substr(2, 9));

  // Only run in development
  if (!enabled) return;

  useEffect(() => {
    const mountDuration = performance.now() - mountTime.current;

    // Use requestIdleCallback for non-essential logging
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        // console.log(
        //   `🚀 ${componentName} mounted in ${mountDuration.toFixed(2)}ms`
        // );

        if (mountDuration > warnOnMountTime) {
          console.warn(
            `⚠️ ${componentName} mount time is high: ${mountDuration.toFixed(
              2
            )}ms`
          );
        }
      });
    }

    renderCount.current += 1;

    return () => {
      const totalRenders = renderCount.current;
      if (totalRenders > warnOnReRenderCount) {
        console.warn(
          `📊 ${componentName} rendered ${totalRenders} times - consider optimization`
        );
      }
    };
  }, []); // Empty dependency array

  // Separate effect for re-render tracking
  useEffect(() => {
    renderCount.current += 1;

    // Throttle re-render warnings
    if (
      renderCount.current > warnOnReRenderCount &&
      renderCount.current % 5 === 0
    ) {
      // Only warn every 5 re-renders
      console.warn(
        `🔄 ${componentName} has re-rendered ${renderCount.current} times`
      );
    }
  });
};
