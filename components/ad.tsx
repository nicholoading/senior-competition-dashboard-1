"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function AdSlideshow() {
  const [ads, setAds] = useState<{ imageUrl: string; link: string }[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const STORAGE_BASE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ad-images/`;

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const { data, error } = await supabase
          .from("ads")
          .select("image_url, link")
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const formattedAds = data.map((ad) => ({
            imageUrl: `${STORAGE_BASE_URL}${ad.image_url}`,
            link: ad.link,
          }));
          setAds(formattedAds);
        } else {
          setError("No ads found.");
        }
      } catch (err: any) {
        setError("Failed to load ads: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length === 0) return;

    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % ads.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [ads.length]);

  if (loading) {
    return <div className="w-full h-[150px] flex items-center justify-center">Loading ads...</div>;
  }

  if (error || ads.length === 0) {
    return (
      <div className="w-full h-[150px] flex items-center justify-center text-gray-500">
        {error || "No advertisements available."}
      </div>
    );
  }

  return (
    <div className="w-full h-[150px] overflow-hidden m-0 p-0">
      <a
        href={ads[currentImage].link}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-full"
      >
        <img
          src={ads[currentImage].imageUrl}
          alt={`Advertisement ${currentImage + 1}`}
          className="w-full h-full object-cover transition-all duration-500 ease-in-out"
        />
      </a>
    </div>
  );
}