import React from "react";
import { FiStar, FiHeart, FiPackage, FiMapPin } from "react-icons/fi";
import { GiSewingNeedle } from "react-icons/gi";
import "../componentStyles/FeatureStrip.css";

const features = [
  {
    id: "f-1",
    icon: <FiStar size={24} />,
    title: "Boutique Exclusives",
    text: "Pieces you won't find elsewhere. Limited runs, singular style.",
  },
  {
    id: "f-2",
    icon: <GiSewingNeedle size={24} />,
    title: "Finely Crafted",
    text: "Every thread chosen with care. Quality that speaks before you do.",
  },
  {
    id: "f-3",
    icon: <FiHeart size={24} />,
    title: "Style With Purpose",
    text: "Wear what moves you. Thoughtful picks for the modern you.",
  },
  {
    id: "f-4",
    icon: <FiPackage size={24} />,
    title: "Effortlessly Yours",
    text: "From our boutique to your door. Smooth, simple, satisfying.",
  },
  {
    id: "f-5",
    icon: <FiMapPin size={24} />,
    title: "Rooted in Chennai",
    text: "Born local, made for you. Authentic style, real stories.",
  },
];

export default function FeatureStrip() {
  return (
    <section className="border-t border-black/5 bg-[#fbf7f0] py-8 sm:py-10">
      <div className="container-page max-w-6xl">
        <div className="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {features.map((f) => (
            <div key={f.id} className="flex flex-col items-center px-2 text-center">
              <div className="text-[color:var(--brand)]">{f.icon}</div>
              <div className="featureTitle mt-3 text-base font-semibold uppercase tracking-[0.18em] text-[#2e2e2e]">
                {f.title}
              </div>
              <div className="mt-2 max-w-[210px] text-sm leading-6 text-[#6b6b6b]">
                {f.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

