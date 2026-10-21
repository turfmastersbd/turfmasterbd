export const TIME_SLOTS = [
  "05:00am to 06:00am",
  "06:00am to 07:00am",
  "07:00am to 08:00am",
  "09:00am to 10:00am",
  "10:00am to 11:00am",
  "11:00am to 12:00pm",
  "12:00pm to 01:00pm",
  "01:00pm to 02:00pm",
  "02:00pm to 03:00pm",
  "03:00pm to 04:00pm",
  "04:00pm to 05:00pm",
  "05:00pm to 06:00pm",
  "06:00pm to 07:00pm",
  "07:00pm to 08:00pm",
  "08:00pm to 09:00pm",
  "09:00pm to 10:00pm",
  "10:00pm to 11:00pm",
  "11:00pm to 12:00am",
  "12:00am to 01:00am",
  "01:00am to 02:00am",
  "02:00am to 03:00am",
  "03:00am to 04:00am",
  "04:00am to 05:00am"
];

/**
 * Determine the day type from a booking date.
 * Returns: "friday" | "saturday" | "regular"
 *
 * 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday,
 * 5 = Friday, 6 = Saturday
 */
export function getDayType(dateInput) {
  if (!dateInput) return "regular";

  let dayOfWeek;
  if (typeof dateInput === "string") {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      dayOfWeek = new Date(year, month, day).getDay();
    } else {
      dayOfWeek = new Date(dateInput).getDay();
    }
  } else if (dateInput instanceof Date) {
    dayOfWeek = dateInput.getDay();
  }

  if (dayOfWeek === 5) return "friday";
  if (dayOfWeek === 6) return "saturday";
  return "regular";
}

/**
 * Calculate the effective slot price considering day-specific overrides,
 * day-specific default prices, and baseline regular prices.
 */
export function calculateSlotPrice(arenaPricing, bookingDate, timeSlot) {
  if (!arenaPricing) return 2000;

  const dayType = bookingDate ? getDayType(bookingDate) : "regular";

  if (dayType === "friday") {
    const override = arenaPricing.fridayTimeSlots?.find((s) => s.slot === timeSlot);
    if (override && typeof override.price === "number" && !isNaN(override.price) && override.price > 0) {
      return override.price;
    }
    if (typeof arenaPricing.fridayDefaultPrice === "number" && !isNaN(arenaPricing.fridayDefaultPrice) && arenaPricing.fridayDefaultPrice > 0) {
      return arenaPricing.fridayDefaultPrice;
    }
  } else if (dayType === "saturday") {
    const override = arenaPricing.saturdayTimeSlots?.find((s) => s.slot === timeSlot);
    if (override && typeof override.price === "number" && !isNaN(override.price) && override.price > 0) {
      return override.price;
    }
    if (typeof arenaPricing.saturdayDefaultPrice === "number" && !isNaN(arenaPricing.saturdayDefaultPrice) && arenaPricing.saturdayDefaultPrice > 0) {
      return arenaPricing.saturdayDefaultPrice;
    }
  }

  // Regular (Sun-Thu) or Fallback
  const override = arenaPricing.timeSlots?.find((s) => s.slot === timeSlot);
  if (override && typeof override.price === "number" && !isNaN(override.price) && override.price > 0) {
    return override.price;
  }

  if (typeof arenaPricing.defaultPrice === "number" && !isNaN(arenaPricing.defaultPrice) && arenaPricing.defaultPrice > 0) {
    return arenaPricing.defaultPrice;
  }

  return 2000;
}
