'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import '../globals.css';

interface EventData {
  _id: string;
  name: string;
  date: string;
  time: string;
  price: number;
}

export default function Admin() {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '19:00',
    price: 12,
  });
  const [events, setEvents] = useState<EventData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/events');
        setEvents(response.data);
      } catch (error) {
        setError('Failed to load events.');
      }
    };
    fetchEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !formData.time || formData.price < 0) {
      setError('All fields are required and price must be non-negative.');
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/api/events', formData);
      setEvents([...events, response.data.event]);
      setFormData({ name: '', date: '', time: '19:00', price: 12 });
      setError(null);
      setSuccess('Event created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to create event.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event? All associated bookings will be removed.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/events/${id}`);
      setEvents(events.filter((event) => event._id !== id));
      setSuccess('Event deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to delete event.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <div className="admin-container">
        <h1>Admin - Manage Events</h1>
        <div className="event-form">
          <h3>Create New Event</h3>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {success && <p className="text-green-500 mb-4">{success}</p>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 text-navy">Event Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="e.g., Movie Night: Avengers"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-navy">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2 border rounded"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-navy">Time</label>
              <select
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="time-picker"
                required
              >
                {['12:00', '14:00', '16:00', '19:00', '21:00'].map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-navy">Price per Seat ($)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full p-2 border rounded"
                min="0"
                step="0.01"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <i className="fas fa-plus"></i> Create Event
            </button>
          </form>
        </div>
        <div className="event-list">
          <h3>Existing Events</h3>
          {events.length === 0 ? (
            <p className="text-center text-navy">No events available.</p>
          ) : (
            events.map((event) => (
              <div key={event._id} className="event-item">
                <div>
                  <p><strong>{event.name}</strong></p>
                  <p>Date: {event.date}</p>
                  <p>Time: {event.time}</p>
                  <p>Price: ${event.price}</p>
                </div>
                <button
                  onClick={() => handleDelete(event._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
                >
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}