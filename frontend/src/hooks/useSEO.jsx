import { useEffect } from "react";

export const useSEO = ({ title, description, keywords, image, url }) => {
  useEffect(() => {
    // Update title
    document.title = title || "Quản lý thửa đất";

    // Update meta description
    updateMetaTag("description", description);

    // Update meta keywords
    updateMetaTag("keywords", keywords);

    // Update Open Graph tags
    updateMetaTag("og:title", title, "property");
    updateMetaTag("og:description", description, "property");
    updateMetaTag("og:image", image, "property");
    updateMetaTag("og:url", url || window.location.href, "property");

    // Update Twitter Card tags
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", image);
  }, [title, description, keywords, image, url]);
};

const updateMetaTag = (name, content, attribute = "name") => {
  if (!content) return;

  let metaTag = document.querySelector(`meta[${attribute}="${name}"]`);

  if (!metaTag) {
    metaTag = document.createElement("meta");
    metaTag.setAttribute(attribute, name);
    document.head.appendChild(metaTag);
  }

  metaTag.setAttribute("content", content);
};
