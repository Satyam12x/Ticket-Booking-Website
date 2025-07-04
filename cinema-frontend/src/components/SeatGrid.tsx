"use client"
import React, { useState } from 'react';
import Seat from './Seat';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';

type SeatStatus = 'available' | 'booked' | 'unavailable' | 'selected';

interface SeatData {
  status: SeatStatus;
  category: 'gold' | 'silver';
  price: number;
}

const SeatGrid: React.FC = () => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  // Define pricing
  const goldPrice = 250;
  const silverPrice = 150;
  
  // Define rows (A-J, 10 rows total)
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const goldRows = ['A', 'B', 'C', 'D', 'E']; // First 5 rows are gold
  const silverRows = ['F', 'G', 'H', 'I', 'J']; // Last 5 rows are silver
  
  // Initialize seat map with 10 rows, 12 columns (6 left + 6 right)
  const initializeSeatMap = (): Record<string, SeatData> => {
    const seatMap: Record<string, SeatData> = {};
    
    rows.forEach(row => {
      const isGold = goldRows.includes(row);
      for (let col = 1; col <= 12; col++) {
        const seatId = `${row}${col}`;
        // Add some random booked/unavailable seats for demo
        const randomStatus = Math.random();
        let status: SeatStatus = 'available';
        
        if (randomStatus < 0.1) status = 'booked';
        else if (randomStatus < 0.15) status = 'unavailable';
        
        seatMap[seatId] = {
          status,
          category: isGold ? 'gold' : 'silver',
          price: isGold ? goldPrice : silverPrice
        };
      }
    });
    
    return seatMap;
  };

  const [seatMap, setSeatMap] = useState<Record<string, SeatData>>(initializeSeatMap());

  const handleSeatClick = (seatId: string) => {
    const seat = seatMap[seatId];
    if (seat.status === 'unavailable' || seat.status === 'booked') return;

    if (seat.status === 'selected') {
      // Deselect the seat
      setSeatMap(prev => ({
        ...prev,
        [seatId]: { ...prev[seatId], status: 'available' }
      }));
      setSelectedSeats(prev => prev.filter(id => id !== seatId));
      setQuantities(prev => {
        const newQuantities = { ...prev };
        delete newQuantities[seatId];
        return newQuantities;
      });
    } else {
      // Select the seat
      setSeatMap(prev => ({
        ...prev,
        [seatId]: { ...prev[seatId], status: 'selected' }
      }));
      setSelectedSeats(prev => {
        if (!prev.includes(seatId)) {
          return [...prev, seatId];
        }
        return prev;
      });
      if (!quantities[seatId]) {
        setQuantities(prev => ({ ...prev, [seatId]: 1 }));
      }
    }
  };

  const handleQuantityChange = (seatId: string, change: number) => {
    setQuantities(prev => {
      const newQuantity = Math.max(1, Math.min(5, (prev[seatId] || 1) + change));
      return { ...prev, [seatId]: newQuantity };
    });
  };

  const handleRemoveSeat = (seatId: string) => {
    setSeatMap(prev => ({
      ...prev,
      [seatId]: { ...prev[seatId], status: 'available' }
    }));
    setSelectedSeats(prev => prev.filter(id => id !== seatId));
    setQuantities(prev => {
      const newQuantities = { ...prev };
      delete newQuantities[seatId];
      return newQuantities;
    });
  };

  const getTotalPrice = () => {
    return selectedSeats.reduce((total, seatId) => {
      const seat = seatMap[seatId];
      const quantity = quantities[seatId] || 1;
      return total + (seat.price * quantity);
    }, 0);
  };

  const getTotalSeats = () => {
    return selectedSeats.reduce((total, seatId) => {
      return total + (quantities[seatId] || 1);
    }, 0);
  };

  const handleProceedToPayment = () => {
    if (selectedSeats.length > 0) {
      setShowBookingModal(true);
    }
  };

  const handleConfirmBooking = () => {
    // Here you would typically integrate with a payment gateway
    alert(`Booking confirmed! Total: ₹${getTotalPrice()} for ${getTotalSeats()} seats`);
    
    // Mark seats as booked
    setSeatMap(prev => {
      const newSeatMap = { ...prev };
      selectedSeats.forEach(seatId => {
        newSeatMap[seatId] = { ...newSeatMap[seatId], status: 'booked' };
      });
      return newSeatMap;
    });
    
    // Reset selections
    setSelectedSeats([]);
    setQuantities({});
    setShowBookingModal(false);
  };

  const renderSeatSection = (sectionRows: string[], title: string, price: number) => {
    return (
      <div className="mb-8">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-blue-900 mb-2">{title}</h3>
          <p className="text-lg font-semibold text-blue-700">₹{price} per seat</p>
        </div>
        
        <div className="space-y-2">
          {sectionRows.map(row => (
            <div key={row} className="flex justify-center items-center gap-2">
              {/* Row label */}
              <div className="w-8 text-center font-bold text-blue-900">{row}</div>
              
              {/* Left section - seats 1-6 */}
              <div className="flex">
                {[1, 2, 3, 4, 5, 6].map(col => {
                  const seatId = `${row}${col}`;
                  const seat = seatMap[seatId];
                  return (
                    <Seat
                      key={seatId}
                      seatNumber={seatId}
                      status={seat.status}
                      category={seat.category}
                      onClick={() => handleSeatClick(seatId)}
                    />
                  );
                })}
              </div>
              
              {/* Aisle gap */}
              <div className="w-8"></div>
              
              {/* Right section - seats 7-12 */}
              <div className="flex">
                {[7, 8, 9, 10, 11, 12].map(col => {
                  const seatId = `${row}${col}`;
                  const seat = seatMap[seatId];
                  return (
                    <Seat
                      key={seatId}
                      seatNumber={seatId}
                      status={seat.status}
                      category={seat.category}
                      onClick={() => handleSeatClick(seatId)}
                    />
                  );
                })}
              </div>
              
              {/* Row label */}
              <div className="w-8 text-center font-bold text-blue-900">{row}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 bg-blue-50 rounded-lg">
      {/* Screen */}
      <div className="text-center mb-8">
        <div className="bg-blue-900 text-white py-3 px-8 rounded-lg inline-block mb-4">
          <h2 className="text-lg font-bold">🎬 SCREEN</h2>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mb-8 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 border-2 border-blue-300 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-700 border-2 border-blue-800 rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-400 border-2 border-red-500 rounded"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 border-2 border-gray-400 rounded"></div>
          <span>Unavailable</span>
        </div>
      </div>

      {/* Gold Section */}
      {renderSeatSection(goldRows, '🏆 GOLD CLASS', goldPrice)}

      {/* Silver Section */}
      {renderSeatSection(silverRows, '🥈 SILVER CLASS', silverPrice)}

      {/* Column numbers */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <div className="w-8"></div>
        <div className="flex">
          {[1, 2, 3, 4, 5, 6].map(col => (
            <div key={`left-${col}`} className="w-10 text-center text-sm font-bold text-blue-900 m-1">
              {col}
            </div>
          ))}
        </div>
        <div className="w-8"></div>
        <div className="flex">
          {[7, 8, 9, 10, 11, 12].map(col => (
            <div key={`right-${col}`} className="w-10 text-center text-sm font-bold text-blue-900 m-1">
              {col}
            </div>
          ))}
        </div>
        <div className="w-8"></div>
      </div>

      {/* Selected Seats Cart */}
      {selectedSeats.length > 0 && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-lg border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <ShoppingCart size={24} />
              Selected Seats ({getTotalSeats()})
            </h3>
            <button
              onClick={handleProceedToPayment}
              className="bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Proceed to Payment
            </button>
          </div>
          
          <div className="space-y-3">
            {selectedSeats.map(seatId => {
              const seat = seatMap[seatId];
              const quantity = quantities[seatId] || 1;
              return (
                <div key={seatId} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="bg-blue-700 text-white px-3 py-1 rounded font-bold">
                      {seatId}
                    </span>
                    <div>
                      <p className="font-semibold text-blue-900">
                        {seat.category === 'gold' ? '🏆 Gold' : '🥈 Silver'} Class
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Quantity:</span>
                        <button
                          onClick={() => handleQuantityChange(seatId, -1)}
                          className="bg-blue-100 text-blue-900 rounded-full p-1 hover:bg-blue-200"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-bold text-blue-900 min-w-8 text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(seatId, 1)}
                          className="bg-blue-100 text-blue-900 rounded-full p-1 hover:bg-blue-200"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-900">
                      ₹{seat.price * quantity}
                    </span>
                    <button
                      onClick={() => handleRemoveSeat(seatId)}
                      className="text-red-500 hover:text-red-700 font-bold"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-blue-900">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-900">₹{getTotalPrice()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-2">Confirm Booking</h2>
              <p className="text-gray-600">Review your seat selection</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Selected Seats:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map(seatId => (
                    <span key={seatId} className="bg-blue-700 text-white px-2 py-1 rounded text-sm">
                      {seatId} ({quantities[seatId] || 1})
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-semibold text-blue-900">Total Seats:</span>
                <span className="font-bold text-blue-900">{getTotalSeats()}</span>
              </div>
              
              <div className="flex justify-between items-center text-xl">
                <span className="font-bold text-blue-900">Total Amount:</span>
                <span className="font-bold text-blue-900">₹{getTotalPrice()}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                className="flex-1 bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatGrid;