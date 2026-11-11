import { RestaurantRow } from '../services/restaurantService';

export interface RecentlyViewedRestaurant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  banner_url?: string | null;
  cuisine?: string | null;
  rating: number;
  city?: string | null;
  address?: string | null;
  delivery_available: boolean;
  takeaway_available: boolean;
  opening_hours?: string | null;
  is_active: boolean;
  viewedAt: number;
}

const RECENTLY_VIEWED_KEY = 'cafeos_customer_recently_viewed_v1';

/**
 * Parses restaurant opening_hours string (e.g. "09:00 - 23:00" or "8:00 AM - 11:30 PM")
 * and determines if the restaurant is currently open according to Indian Standard Time (IST).
 */
export function isRestaurantOpen(
  openingHours?: string | null,
  isActive = true
): { isOpen: boolean; label: string; details?: string } {
  if (!isActive) {
    return { isOpen: false, label: 'Closed' };
  }

  if (!openingHours || typeof openingHours !== 'string' || !openingHours.trim()) {
    // Default to open during standard operating service if active
    return { isOpen: true, label: 'Open Now' };
  }

  const clean = openingHours.trim();

  // Try 24-hr format "HH:MM - HH:MM" or "HH:MM-HH:MM"
  const range24Match = clean.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (range24Match) {
    const startHour = parseInt(range24Match[1], 10);
    const startMin = parseInt(range24Match[2], 10);
    const endHour = parseInt(range24Match[3], 10);
    const endMin = parseInt(range24Match[4], 10);

    const now = new Date();
    // Get current hour and minute in Indian Standard Time (Asia/Kolkata)
    const istTimeStr = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    const [curHour, curMin] = istTimeStr.split(':').map((s) => parseInt(s, 10));

    const curTotalMin = curHour * 60 + curMin;
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    let isOpen = false;
    if (endTotalMin >= startTotalMin) {
      isOpen = curTotalMin >= startTotalMin && curTotalMin <= endTotalMin;
    } else {
      // Overnight hours (e.g. 18:00 - 02:00)
      isOpen = curTotalMin >= startTotalMin || curTotalMin <= endTotalMin;
    }

    return {
      isOpen,
      label: isOpen ? 'Open Now' : 'Closed',
      details: clean,
    };
  }

  // Try 12-hr format "8:00 AM - 11:30 PM"
  const range12Match = clean.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)\s*-\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
  if (range12Match) {
    let startH = parseInt(range12Match[1], 10);
    const startM = range12Match[2] ? parseInt(range12Match[2], 10) : 0;
    const startPeriod = range12Match[3].toUpperCase();

    let endH = parseInt(range12Match[4], 10);
    const endM = range12Match[5] ? parseInt(range12Match[5], 10) : 0;
    const endPeriod = range12Match[6].toUpperCase();

    if (startPeriod === 'PM' && startH < 12) startH += 12;
    if (startPeriod === 'AM' && startH === 12) startH = 0;
    if (endPeriod === 'PM' && endH < 12) endH += 12;
    if (endPeriod === 'AM' && endH === 12) endH = 0;

    const now = new Date();
    const istTimeStr = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    const [curHour, curMin] = istTimeStr.split(':').map((s) => parseInt(s, 10));

    const curTotalMin = curHour * 60 + curMin;
    const startTotalMin = startH * 60 + startM;
    const endTotalMin = endH * 60 + endM;

    let isOpen = false;
    if (endTotalMin >= startTotalMin) {
      isOpen = curTotalMin >= startTotalMin && curTotalMin <= endTotalMin;
    } else {
      isOpen = curTotalMin >= startTotalMin || curTotalMin <= endTotalMin;
    }

    return {
      isOpen,
      label: isOpen ? 'Open Now' : 'Closed',
      details: clean,
    };
  }

  return {
    isOpen: true,
    label: 'Open Today',
    details: clean,
  };
}

/**
 * Record a restaurant in recently viewed storage.
 */
export function addRecentlyViewedRestaurant(r: RestaurantRow): void {
  try {
    const list = getRecentlyViewedRestaurants();
    const filtered = list.filter((item) => item.id !== r.id);
    const newItem: RecentlyViewedRestaurant = {
      id: r.id,
      name: r.name,
      slug: r.slug,
      logo_url: r.logo_url,
      banner_url: r.banner_url,
      cuisine: r.cuisine,
      rating: Number(r.rating) || 4.8,
      city: r.city,
      address: r.address,
      delivery_available: r.delivery_available,
      takeaway_available: r.takeaway_available,
      opening_hours: r.opening_hours,
      is_active: r.is_active,
      viewedAt: Date.now(),
    };

    const updated = [newItem, ...filtered].slice(0, 8);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save recently viewed restaurant', err);
  }
}

/**
 * Retrieve recently viewed restaurants from local storage.
 */
export function getRecentlyViewedRestaurants(): RecentlyViewedRestaurant[] {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

