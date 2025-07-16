'use client'; // This directive is necessary for client-side components in App Router

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function RouteChangeLoader() {
  // State to control the visibility of the loading overlay
  const [isLoading, setIsLoading] = useState(false);

  // Get the current pathname and search parameters from Next.js navigation
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // useEffect to listen for route changes
  useEffect(() => {
    // Function to show the loading overlay
    const handleStart = () => setIsLoading(true);
    // Function to hide the loading overlay
    const handleComplete = () => setIsLoading(false);

    // In Next.js App Router, there isn't a direct `router.events` like in Pages Router.
    // Instead, we can infer route changes by monitoring `pathname` and `searchParams`.
    // When these change, it signifies a new navigation.
    // We can simulate the start and complete by setting a timeout for a brief visual.
    // For a real application, you might tie this to actual data fetching states
    // or a global loading context if you have one.

    // Simulate route change start
    handleStart();

    // Simulate route change complete after a short delay
    // In a real app, this would be tied to actual page load completion
    // or data fetching completion.
    const timer = setTimeout(() => {
      handleComplete();
    }, 300); // A small delay to ensure the spinner is visible briefly

    // Cleanup function: Clear the timeout if the component unmounts
    // or the dependencies change before the timeout fires.
    return () => clearTimeout(timer);

  }, [pathname, searchParams]); // Re-run effect when pathname or searchParams change

  if (!isLoading) return null; // Don't render anything if not loading

  return (
    // The main container for the loading overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 backdrop-blur-sm">
      {/* Loading spinner */}
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="mt-4 text-white text-lg font-semibold">Loading...</p>
      </div>
    </div>
  );
};