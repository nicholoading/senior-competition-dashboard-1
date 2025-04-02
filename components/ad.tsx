// components/ad.tsx
"use client";

import { useState, useEffect } from "react";

export function AdSlideshow() {
  // Array of images
  const images = [
    "https://picsum.photos/1200/300?random=1",
    "https://picsum.photos/1200/300?random=2",
    "https://picsum.photos/1200/300?random=3",
    "https://picsum.photos/1200/300?random=4",
  ];

  // Array of corresponding links (random example links)
  const links = [
    "https://youtube.com",
    "https://stackoverflow.com",
    "https://google.com",
    "https://github.com",
  ];

  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="w-full h-[150px] overflow-hidden m-0 p-0">
      <a
        href={links[currentImage]}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-full"
      >
        <img
          src={images[currentImage]}
          alt={`Advertisement ${currentImage + 1}`}
          className="w-full h-full object-cover transition-all duration-500 ease-in-out"
        />
      </a>
    </div>
  );
}