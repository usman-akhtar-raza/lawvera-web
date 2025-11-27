import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Briefcase, DollarSign } from 'lucide-react';
import type { LawyerProfile } from '@/types';

interface LawyerCardProps {
  lawyer: LawyerProfile;
}

export function LawyerCard({ lawyer }: LawyerCardProps) {
  const user = lawyer.user as any;
  const rating = lawyer.ratingAverage || 0;
  const reviewCount = lawyer.ratingCount || 0;

  return (
    <Link href={`/lawyers/${lawyer._id}`}>
      <div className="brand-card hover:border-[#d5b47f]/40 transition-all p-6 cursor-pointer">
        <div className="flex items-start space-x-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white/10 flex-shrink-0 border border-white/20">
            {lawyer.profilePhotoUrl || user?.avatarUrl ? (
              <Image
                src={lawyer.profilePhotoUrl || user?.avatarUrl || ''}
                alt={user?.name || 'Lawyer'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/5 text-[#d5b47f] text-2xl font-bold">
                {(user?.name || 'L')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
              {user?.name || 'Lawyer'}
            </h3>
            <p className="text-[#d5b47f] font-medium mb-2">
              {lawyer.specialization}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)] mb-3">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-[#f3c969] mr-1 fill-current" />
                <span className="font-medium">{rating.toFixed(1)}</span>
                {reviewCount > 0 && (
                  <span className="ml-1">({reviewCount})</span>
                )}
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {lawyer.city}
              </div>
              <div className="flex items-center">
                <Briefcase className="h-4 w-4 mr-1" />
                {lawyer.experienceYears} years
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-lg font-bold text-[var(--text-primary)]">
                <DollarSign className="h-5 w-5 text-[#46d3a1]" />
                <span>{lawyer.consultationFee}</span>
              </div>
              <span className="text-[#d5b47f] font-medium hover:text-[#f3e2c1]">
                View Profile →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

