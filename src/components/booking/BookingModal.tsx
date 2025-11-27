'use client';

import { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { format, addDays, isAfter, startOfDay } from 'date-fns';
import type { LawyerProfile, AvailabilitySlot } from '@/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';

interface BookingModalProps {
  lawyer: LawyerProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BookingModal({
  lawyer,
  isOpen,
  onClose,
  onSuccess,
}: BookingModalProps) {
  const { isAuthenticated } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const getAvailableDates = () => {
    const dates: Date[] = [];
    const today = startOfDay(new Date());
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      dates.push(date);
    }
    return dates;
  };

  const getAvailableSlots = () => {
    if (!selectedDate) return [];
    const dayName = format(selectedDate, 'EEEE');
    const daySchedule = lawyer.availability.find(
      (slot) => slot.day === dayName,
    );
    return daySchedule?.slots || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to book an appointment');
      return;
    }
    if (!selectedDate || !selectedTime) {
      toast.error('Please select a date and time');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createBooking({
        lawyerId: lawyer._id,
        slotDate: selectedDate.toISOString(),
        slotTime: selectedTime,
        reason,
      });
      toast.success('Appointment booked successfully!');
      onSuccess?.();
      onClose();
      setSelectedDate(null);
      setSelectedTime('');
      setReason('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#050c26] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50">
        <div className="sticky top-0 bg-[#050c26] border-b border-white/10 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Book Appointment
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-[var(--text-secondary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-[var(--text-primary)]">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Select Date
            </label>
            <div className="grid grid-cols-7 gap-2">
              {getAvailableDates().map((date) => {
                const dayName = format(date, 'EEEE');
                const hasSlots = lawyer.availability.some(
                  (slot) => slot.day === dayName && slot.slots.length > 0,
                );
                const isPast = !isAfter(date, startOfDay(new Date()));
                const isSelected =
                  selectedDate &&
                  format(selectedDate, 'yyyy-MM-dd') ===
                    format(date, 'yyyy-MM-dd');

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime('');
                    }}
                    disabled={!hasSlots || isPast}
                    className={`p-3 rounded-lg border text-sm transition-colors ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] border-transparent'
                        : hasSlots && !isPast
                          ? 'border-white/10 text-[var(--text-primary)] hover:border-[#d5b47f]/40 bg-white/5'
                          : 'border-white/5 bg-white/5 text-[var(--text-muted)] cursor-not-allowed'
                    }`}
                  >
                    <div className="font-medium">{format(date, 'd')}</div>
                    <div className="text-xs">{format(date, 'EEE')}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Select Time
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {getAvailableSlots().map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`p-3 rounded-lg border text-sm transition-colors ${
                      selectedTime === slot
                        ? 'bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] border-transparent'
                        : 'border-white/10 text-[var(--text-primary)] hover:border-[#d5b47f]/40 bg-white/5'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              {getAvailableSlots().length === 0 && (
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  No available slots for this day
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Reason for Consultation (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[#0d1735] border border-white/10 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
              placeholder="Briefly describe your legal needs..."
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[var(--text-secondary)] border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedDate || !selectedTime || isSubmitting}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

