"use client";

export default function LoadingElement() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin" />
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    );
  }
  