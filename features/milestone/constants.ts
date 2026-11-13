/** 1K kutlaması: ilk bin üye profilinde kalıcı "Kurucu 1000" rozeti taşır. */
export const MILESTONE_ID = '1k';
export const FOUNDER_LIMIT = 1000;

export const isFounder = (memberNumber?: number | null): boolean =>
  typeof memberNumber === 'number' && Number.isInteger(memberNumber)
  && memberNumber >= 1 && memberNumber <= FOUNDER_LIMIT;
