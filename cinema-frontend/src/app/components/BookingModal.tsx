import { useState } from 'react';
import axios from 'axios';

interface BookingModalProps {
  seatId: string;
  price: number;
  quantity: number;
  onClose: () => void;
  bookingDate: string;
}

export default function BookingModal({ seatId, price, quantity, onClose, bookingDate }: BookingModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bookingDate,
    quantity,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/seats/book', {
        seatId,
        ...formData,
      });
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Booking failed:', error);
    }
  };

  return (
    <div className="modal">
      <h2 className="text-xl font-bold mb-4">Book Seat {seatId}</h2>
      <p className="mb-2">Row: {seatId[0]}, Seat: {seatId.slice(1)}</p>
      <p className="mb-2">Price: ₹{ 300}</p>
      <p className="mb-2">Quantity: {quantity}</p>
      <p className="mb-4">Total: ₹{ 300 * quantity}</p>
      <p className="mb-4">Date: {formData.bookingDate}</p>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 submit-btn"
        >
          Confirm Booking
        </button>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 cancel-btn"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}