import React from 'react';
import { FaChair } from 'react-icons/fa';
import clsx from 'clsx';

interface SeatProps {
  seatNumber: string;
  status: 'available' | 'booked' | 'unavailable' | 'selected';
  category: 'gold' | 'silver';
  onClick: () => void;
}

const Seat: React.FC<SeatProps> = ({ seatNumber, status,  onClick }) => {
  return (
    <button
      className={clsx(
        'w-10 h-10 m-1 rounded-lg flex items-center justify-center border-2 text-xs font-bold transition-all duration-200 relative',
        {
          // Available seats
          'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100 hover:border-blue-400': 
            status === 'available',
          // Booked seats
          'bg-red-400 text-white border-red-500 cursor-not-allowed': 
            status === 'booked',
          // Unavailable seats
          'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400': 
            status === 'unavailable',
          // Selected seats
          'bg-blue-700 text-white border-blue-800 shadow-lg': 
            status === 'selected',
        }
      )}
      onClick={status === 'available' || status === 'selected' ? onClick : undefined}
      disabled={status === 'unavailable' || status === 'booked'}
    >
      <span className="absolute top-0 left-0 text-[8px] font-bold p-0.5">
        {seatNumber}
      </span>
      <FaChair className="mt-1" />
    </button>
  );
};

export default Seat;