import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../utils/axiosInstance.js";
import HeroSlider from "../components/HeroSlider.jsx";
import ProductSection from "../components/ProductSection.jsx";
import FeatureStrip from "../components/FeatureStrip.jsx";
import RevealOnScroll from "../components/RevealOnScroll.jsx";
import Loader from "../components/Loader.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { getProductImage } from "../utils/imageHelper.js";
import "../pageStyles/Home.css";
import { heroBanners } from "../data/homeData.js";

/**
 * Map an API product to the shape ProductCard expects.
 */
const mapProduct = (p) => ({
  _id: p._id,
  id: p._id,
  name: p.name,
  price: p.price,
  image: getProductImage(p),
  // keep real-time ratings for Home sections
  ratings: p.ratings ?? 0,
  numOfReviews: p.numOfReviews ?? 0,
});

/**
 * Fetch a section of products from the API.
 */
async function fetchSection(params) {
  try {
    const { data } = await axiosInstance.get("/api/v1/products", { params });
    return (data.products || []).map(mapProduct);
  } catch {
    return [];
  }
}

export default function Home() {
  usePageTitle("Home");

  const [loading, setLoading] = useState(true);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSarees, setBestSarees] = useState([]);
  const [bestSalwars, setBestSalwars] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadSections() {
      setLoading(true);
      try {
        // Fetch all three sections in parallel
        const [arrivals, sarees, salwars] = await Promise.all([
          fetchSection({ isNewArrival: true, limit: 8 }),
          fetchSection({ category: "Saree", isBestSeller: true, limit: 8 }),
          fetchSection({ category: "Salwar", isBestSeller: true, limit: 8 }),
        ]);

        if (cancelled) return;

        setNewArrivals(arrivals);
        setBestSarees(sarees);
        setBestSalwars(salwars);
      } catch {
        if (cancelled) return;
        toast.error("Failed to load products");
        setNewArrivals([]);
        setBestSarees([]);
        setBestSalwars([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSections();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <HeroSlider banners={heroBanners} />

      <RevealOnScroll>
        <ProductSection
          title="New Arrivals"
          products={newArrivals}
          ctaTo="/new-arrivals"
        />
      </RevealOnScroll>
      <RevealOnScroll>
        <ProductSection
          title="Best Seller - Sarees"
          products={bestSarees}
          ctaTo="/sarees"
        />
      </RevealOnScroll>
      <RevealOnScroll>
        <ProductSection
          title="Best Seller - Salwars"
          products={bestSalwars}
          ctaTo="/salwars"
        />
      </RevealOnScroll>

      <RevealOnScroll>
        <FeatureStrip />
      </RevealOnScroll>
    </div>
  );
}
