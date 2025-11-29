"use client";

import Earth from "@/components/Earth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/userStore";

export default function Home() {
  const router = useRouter();
  const userInfo = useAuthStore((s) => s.userInfo);

  const handleGetStarted = () => {
    if (userInfo) {
      router.push("/dashboard");
    } else {
      window.alert("Please log in to continue.");
    }
  }

  return (
    <div className="w-full h-screen bg-black text-gray-300 relative font-sans overflow-hidden">
      <Navbar />
      {/* 3D Canvas */}
      <div className="absolute bottom-0 w-full h-full pointer-events-none z-0">
        <Earth isFull={false} />
      </div>

      {/* Hero Section */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 px-6 max-w-3xl mx-auto select-none">
        <h1 className="text-6xl font-extrabold mb-6 tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
          S.C.O.P.E.
        </h1>
        <p className="mb-10 text-white/50 text-base leading-relaxed max-w-lg">
          S.C.O.P.E., (Satellite-ground Collaborative Observation Performance
          Evaluator), Light and easy visualization for LEO satellite
          experiments.
        </p>
        <button
          onClick={handleGetStarted}
          className="relative inline-block rounded-md border border-white bg-transparent px-8 py-3 font-semibold text-white shadow-[0_0_15px_rgba(255,255,255,0.6)] transition hover:bg-white hover:text-black hover:scale-105 hover:cursor-pointer"
        >
          Get Started
        </button>
      </div>
      <Footer />
    </div>
  );
}
