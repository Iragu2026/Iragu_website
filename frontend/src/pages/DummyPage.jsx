import React from "react";
import usePageTitle from "../hooks/usePageTitle.js";
import "../pageStyles/DummyPage.css";

export default function DummyPage({ title }) {
  usePageTitle(title);

  return (
    <div className="container-page py-14 sm:py-20">
      <div className="rounded-md bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-10">
        <div className="dummyTitle">{title}</div>
        <p className="mt-3 text-sm text-[#6b6b6b]">
          This page is a placeholder for now. Once the Home page is finalized, we can build this
          page next.
        </p>
      </div>
    </div>
  );
}

