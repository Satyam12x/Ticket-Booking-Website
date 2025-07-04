'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Seat from './components/Seat';
import BookingModal from './components/BookingModal';
import './globals.css'; // Ensure CSS loads

interface SeatData {
  seatId: string;
  row: string;
  column: number;
  status: 'available' | 'booked';
  price: number;
  bookedBy?: { name: string; email: string; phone: string };
}

export default function Home() {
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/seats?date=${selectedDate}`);
        console.log('Fetched seats:', response.data);
        if (response.data.length === 0) {
          setError('No seats found in the database.');
        } else {
          setSeats(response.data.sort((a: SeatData, b: SeatData) => a.seatId.localeCompare(b.seatId)));
          setError(null);
        }
      } catch (error: any) {
        console.error('Failed to fetch seats:', error);
        setError('Failed to load seats. Ensure the backend is running at http://localhost:5000.');
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [selectedDate]);

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeat(seatId);
    setSelectedQuantity(1);
  };

  const handleProceedToBook = () => {
    setShowBookingModal(true);
  };

  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const columns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <div className="theater-container">
        <h1>Book Your Show</h1>

        <div className="flex justify-center mb-6">
          <div>
            <label className="block mb-2 text-navy font-semibold">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-picker"
              min={new Date().toISOString().split('T')[0]}
              aria-label="Select booking date"
            />
          </div>
        </div>

        <div className="legend">
          <div className="legend-item">
            <div className="legend-box  avail">
              {/* <i className="fas fa-chair"></i> */}
            </div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-box  booked">
              {/* <i className="fas fa-chair"></i> */}
            </div>
            <span>Booked</span>
          </div>
          {/* <div className="legend-item">
            <div className="legend-box bg-blue-600 border border-blue-700">
              <i className="fas fa-check"></i>
            </div>
            <span>Selected</span>
          </div> */}
        </div>

        <div className="flex justify-center mb-8">
          <h3>Standard Seats (₹ 300)</h3>
        </div>

        {loading && (
          <div className="text-center text-navy my-6">Loading seats...</div>
        )}

        {error && (
          <div className="text-red-500 text-center my-6">{error}</div>
        )}

        {!loading && !error && seats.length === 0 && (
          <div className="text-center text-navy my-6">
            No seats available. Please check the backend.
          </div>
        )}

        {/* <div className="screen">Screen</div> */}

        <div className="seat-grid-container">
          <div className="seat-grid">
            <div className='column-row'>
            {columns.map((col) => (
              <div key={col} className="column-label">{col}</div>
            ))}</div>
            {rows.map((row) => (
              <div key={row} className="seat-row">
                <div className="row-label">{row}</div>
                {columns.map((col) => {
                  const seatId = `${row}${col}`;
                  const seat = seats.find((s) => s.seatId === seatId);
                  return seat ? (
                    <Seat
                      key={seatId}
                      seat={seat}
                      onSelect={handleSeatSelect}
                    />
                  ) : (
                    <div
                      key={seatId}
                      className="seat seat-available"
                      aria-hidden="true"
                    >
                      {seatId}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {selectedSeat && (
          <div className="dynamic-modal">
            <h3 className="text-lg font-semibold text-navy mb-2">Seat Details</h3>
            <p className="mb-1">Row: {selectedSeat[0]}</p>
            <p className="mb-1">Seat: {selectedSeat.slice(1)}</p>
            <p className="mb-1">Price: ₹ 300</p>
            <div className="mb-2">
              <label className="block mb-1 text-navy">Quantity (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                className="w-full p-2 border rounded"
                aria-label="Select quantity"
              />
            </div>
            <p className="mb-2 font-semibold">Total: ₹{ 300 * selectedQuantity}</p>
            <button
              onClick={handleProceedToBook}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <i className="fas fa-ticket-alt"></i> Proceed to Book
            </button>
          </div>
        )}

        {showBookingModal && selectedSeat && (
          <BookingModal
            seatId={selectedSeat}
            price={12}
            quantity={selectedQuantity}
            bookingDate={selectedDate}
            onClose={() => {
              setShowBookingModal(false);
              setSelectedSeat(null);
            }}
          />
        )}
      </div>
    </main>
  );
}