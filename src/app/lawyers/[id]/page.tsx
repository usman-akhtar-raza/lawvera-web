'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import {
  Star,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';
import { api } from '@/lib/api';
import { BookingModal } from '@/components/booking/BookingModal';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function LawyerDetailPage() {
  const params = useParams();
  const lawyerId = params.id as string;
  const { isAuthenticated } = useAuthStore();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const { data: lawyer, isLoading } = useQuery({
    queryKey: ['lawyer', lawyerId],
    queryFn: () => api.getLawyerById(lawyerId),
  });

  const handleAddReview = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add a review');
      return;
    }
    try {
      await api.addReview(lawyerId, {
        rating,
        comment: reviewComment,
      });
      toast.success('Review added successfully!');
      setReviewComment('');
      // Refetch lawyer data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add review');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
        <div className="text-center text-[var(--text-secondary)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d5b47f] mx-auto"></div>
          <p className="mt-4">Loading lawyer profile...</p>
        </div>
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
        <div className="text-center text-[var(--text-secondary)]">
          <p className="text-lg">Lawyer not found</p>
        </div>
      </div>
    );
  }

  const user = lawyer.user as any;
  const reviews = lawyer.reviews || [];

  return (
    <div className="min-h-screen bg-[var(--background-muted)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="brand-card brand-card--muted overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 p-8 bg-white/5 border-r border-white/5">
              <div className="text-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-white/10 border border-white/10 mx-auto mb-4">
                  {lawyer.profilePhotoUrl || user?.avatarUrl ? (
                    <Image
                      src={lawyer.profilePhotoUrl || user?.avatarUrl || ''}
                      alt={user?.name || 'Lawyer'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5 text-[#d5b47f] text-4xl font-bold">
                      {(user?.name || 'L')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  {user?.name || 'Lawyer'}
                </h1>
                <p className="text-[#d5b47f] font-medium mb-4">
                  {lawyer.specialization}
                </p>
                <div className="flex items-center justify-center mb-4">
                  <Star className="h-5 w-5 text-[#f3c969] fill-current mr-1" />
                  <span className="font-semibold text-lg">
                    {lawyer.ratingAverage.toFixed(1)}
                  </span>
                  {lawyer.ratingCount > 0 && (
                    <span className="ml-2 text-[var(--text-secondary)]">
                      ({lawyer.ratingCount} reviews)
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm text-[var(--text-secondary)] mb-6">
                  <div className="flex items-center justify-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {lawyer.city}
                  </div>
                  <div className="flex items-center justify-center">
                    <Briefcase className="h-4 w-4 mr-2" />
                    {lawyer.experienceYears} years experience
                  </div>
                  <div className="flex items-center justify-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    ${lawyer.consultationFee} consultation fee
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error('Please login to book an appointment');
                      return;
                    }
                    setShowBookingModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-[#f3e2c1] via-[#e6c891] to-[#d5b47f] text-[#1b1205] py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#d5b47f]/40 transition-all"
                >
                  Book Appointment
                </button>
              </div>
            </div>

            <div className="md:w-2/3 p-8 bg-transparent">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                  About
                </h2>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {lawyer.description || 'No description available.'}
                </p>
              </div>

              {lawyer.education && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Education
                  </h3>
                  <p className="text-[var(--text-secondary)]">{lawyer.education}</p>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Availability
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lawyer.availability.map((slot) => (
                    <div
                      key={slot.day}
                      className="border border-white/10 rounded-lg p-4"
                    >
                      <h4 className="font-semibold text-[var(--text-primary)] mb-2">
                        {slot.day}
                      </h4>
                      {slot.slots.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {slot.slots.map((time) => (
                            <span
                              key={time}
                              className="px-3 py-1 rounded text-sm bg-white/5 border border-white/10 text-[var(--text-secondary)]"
                            >
                              {time}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[var(--text-muted)] text-sm">
                          Not available
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Reviews ({reviews.length})
                </h3>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review, index) => (
                      <div
                        key={index}
                        className="border border-white/10 rounded-lg p-4 bg-white/5"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'text-[#f3c969] fill-current'
                                    : 'text-white/20'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-[var(--text-muted)]">
                            {format(
                              new Date(review.createdAt),
                              'MMM d, yyyy',
                            )}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-[var(--text-secondary)]">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[var(--text-muted)]">No reviews yet</p>
                )}

                {isAuthenticated && (
                  <div className="mt-6 border-t border-white/10 pt-6">
                    <h4 className="font-semibold text-[var(--text-primary)] mb-4">
                      Add a Review
                    </h4>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Rating
                      </label>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setRating(value)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                value <= rating
                                  ? 'text-[#f3c969] fill-current'
                                  : 'text-white/20'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Comment
                      </label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
                        placeholder="Share your experience..."
                      />
                    </div>
                    <button
                      onClick={handleAddReview}
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] font-semibold hover:shadow-lg hover:shadow-[#d5b47f]/30 transition-all"
                    >
                      Submit Review
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBookingModal && (
        <BookingModal
          lawyer={lawyer}
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            // Refetch lawyer data if needed
          }}
        />
      )}
    </div>
  );
}

