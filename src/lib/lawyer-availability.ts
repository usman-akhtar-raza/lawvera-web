export interface AvailabilitySelection {
  day: string;
  slots: string[];
}

export const LAWYER_AVAILABILITY_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const LAWYER_TIME_SLOTS = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
] as const;

export const createEmptyAvailability = (): AvailabilitySelection[] =>
  LAWYER_AVAILABILITY_DAYS.map((day) => ({ day, slots: [] }));

export const normalizeAvailability = (
  source: AvailabilitySelection[] = [],
): AvailabilitySelection[] =>
  LAWYER_AVAILABILITY_DAYS.map((day) => ({
    day,
    slots: source.find((item) => item.day === day)?.slots ?? [],
  }));

export const getFilledAvailability = (
  availability: AvailabilitySelection[],
): AvailabilitySelection[] =>
  availability.filter((item) => item.slots.length > 0);
