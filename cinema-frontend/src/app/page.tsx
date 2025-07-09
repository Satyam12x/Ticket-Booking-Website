"use client";
import React, { useState, useEffect } from 'react';
import BookingLayout from './components/BookingLayout';
import Loader from './components/loader'; // Adjust path if Loader.tsx is in a different folder

const Page = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading (e.g., fetching data from MongoDB via Express)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3-second delay, adjust as needed

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Loader isLoading={isLoading} />
      {!isLoading && <BookingLayout />}
    </>
  );
};

export default Page;