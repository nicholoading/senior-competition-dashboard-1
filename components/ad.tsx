// components/ad.tsx
"use client";

import { useState, useEffect } from "react";

export function AdSlideshow() {
  // Array of images
  const images = [
    "https://www.gstatic.com/youtube/img/promos/growth/YTP_logo_social_1200x630.png?days_since_epoch=20180",
    "https://miro.medium.com/v2/resize:fit:1200/1*rEQGD7eciTUkoaePqyqY2A.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png",
    "https://miro.medium.com/v2/resize:fit:1125/1*dDNpLKu_oTLzStsDTnkJ-g.png",
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