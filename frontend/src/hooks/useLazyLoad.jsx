export const useLazyLoad = (threshold = 0.1) => {
  const observerRef = useRef();

  const observe = useCallback(
    (element, callback) => {
      if (!element) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              callback();
              observerRef.current.unobserve(entry.target);
            }
          });
        },
        { threshold }
      );

      observerRef.current.observe(element);
    },
    [threshold]
  );

  return { observe };
};
