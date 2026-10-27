/**
 * Checkout Form Validation Utilities for US Storefront & Razorpay Pre-flight
 *
 * Validates all required customer contact & US shipping address fields
 * before initiating the Razorpay checkout modal or creating an order.
 */

import { isValidUSState, isValidUSZip, normalizeStateCode, US_STATES, validateZipForState } from './tax/jurisdiction';

export interface CheckoutFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  streetAddress: string;
  aptSuite?: string;
  city: string;
  state: string;
  zipCode: string;
  paymentMethod?: string;
  deliveryDate?: string;
  acknowledgedDeliveryTimeframe?: boolean;
}

export interface CheckoutValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  firstErrorMessage: string | null;
  firstErrorField: string | null;
}

/**
 * Validates a customer's full name.
 */
export function validateCustomerName(name?: string | null): string | null {
  if (!name || typeof name !== 'string') {
    return 'Full name is required.';
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return 'Full name must be at least 2 characters.';
  }
  // Must contain letters
  if (!/[a-zA-Z]/.test(trimmed)) {
    return 'Please enter a valid name containing letters.';
  }
  return null;
}

/**
 * Validates a US phone number.
 * Accepts formats: (510) 555-0123, 510-555-0123, +1 510 555 0123, 5105550123, etc.
 */
export function validateCustomerPhone(phone?: string | null): string | null {
  if (!phone || typeof phone !== 'string') {
    return 'Phone number is required.';
  }
  const trimmed = phone.trim();
  if (!trimmed) {
    return 'Phone number is required.';
  }

  // Extract pure digits
  let digits = trimmed.replace(/\D/g, '');

  // Strip leading US country code '1' if 11 digits
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }

  if (digits.length !== 10) {
    return 'Please enter a valid 10-digit US phone number (e.g., (510) 555-0123).';
  }

  // NANP rule: area code & central office code cannot start with 0 or 1
  if (digits[0] === '0' || digits[0] === '1') {
    return 'Please enter a valid US area code.';
  }

  return null;
}

/**
 * Validates an email address format.
 */
export function validateCustomerEmail(email?: string | null): string | null {
  if (!email || typeof email !== 'string') {
    return 'Email address is required.';
  }
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Email address is required.';
  }

  // Standard RFC 5322 compatible email regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid email address (e.g., name@example.com).';
  }

  return null;
}

/**
 * Validates a street address.
 */
export function validateStreetAddress(street?: string | null): string | null {
  if (!street || typeof street !== 'string') {
    return 'Street address is required.';
  }
  const trimmed = street.trim();
  if (trimmed.length < 5) {
    return 'Please enter a valid street address (minimum 5 characters, e.g., 123 Mission Blvd).';
  }
  return null;
}

/**
 * Validates a US city name.
 */
export function validateCity(city?: string | null): string | null {
  if (!city || typeof city !== 'string') {
    return 'City is required.';
  }
  const trimmed = city.trim();
  if (trimmed.length < 2) {
    return 'City must be at least 2 characters.';
  }
  if (!/[a-zA-Z]/.test(trimmed)) {
    return 'Please enter a valid city name.';
  }
  return null;
}

/**
 * Validates a US 2-letter state code.
 */
export function validateState(state?: string | null): string | null {
  if (!state || typeof state !== 'string') {
    return 'State is required.';
  }
  const normalized = normalizeStateCode(state);
  if (!normalized || !isValidUSState(normalized)) {
    return 'Please select a valid US state.';
  }
  return null;
}

/**
 * Validates a US ZIP code (5 digits or ZIP+4).
 */
export function validateZipCode(zip?: string | null, stateCode?: string | null): string | null {
  const result = validateZipForState(zip, stateCode);
  return result.isValid ? null : (result.error || 'Please enter a valid 5-digit US ZIP code.');
}

/**
 * Validates requested event / delivery date.
 */
export function validateDeliveryDate(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) {
    return 'Please select your requested event / delivery date.';
  }
  const cleanDate = dateStr.trim();
  const parsed = new Date(cleanDate);
  if (isNaN(parsed.getTime())) {
    return 'Please enter a valid delivery date.';
  }
  const todayStr = new Date().toISOString().split('T')[0];
  if (cleanDate < todayStr) {
    return 'Delivery date cannot be in the past.';
  }
  return null;
}

/**
 * Comprehensive pre-flight checkout form validator.
 * Validates every customer field before loading Razorpay or submitting order.
 */
export function validateCheckoutForm(
  form: Partial<CheckoutFormData>,
  cartItemCount: number = 1,
  deliveryType?: 'shipping' | 'pickup' | string
): CheckoutValidationResult {
  const errors: Record<string, string> = {};

  if (cartItemCount <= 0) {
    errors.cart = 'Your cart is empty. Please add items before checking out.';
  }

  const nameError = validateCustomerName(form.customerName);
  if (nameError) errors.customerName = nameError;

  const phoneError = validateCustomerPhone(form.customerPhone);
  if (phoneError) errors.customerPhone = phoneError;

  const emailError = validateCustomerEmail(form.customerEmail);
  if (emailError) errors.customerEmail = emailError;

  const isPickup = deliveryType === 'pickup';

  // For physical delivery, street, city, state and zip are strictly required.
  // For in-person local pickup, address is optional billing contact info.
  if (!isPickup || form.streetAddress) {
    const streetError = validateStreetAddress(form.streetAddress);
    if (streetError) errors.streetAddress = streetError;
  }

  if (!isPickup || form.city) {
    const cityError = validateCity(form.city);
    if (cityError) errors.city = cityError;
  }

  if (!isPickup || form.state) {
    const stateError = validateState(form.state);
    if (stateError) errors.state = stateError;
  }

  if (!isPickup || form.zipCode) {
    const zipError = validateZipCode(form.zipCode, form.state);
    if (zipError) errors.zipCode = zipError;
  }

  const deliveryDateError = validateDeliveryDate(form.deliveryDate);
  if (deliveryDateError) errors.deliveryDate = deliveryDateError;


  const fieldKeys = Object.keys(errors);
  const isValid = fieldKeys.length === 0;
  const firstErrorField = isValid ? null : fieldKeys[0];
  const firstErrorMessage = isValid ? null : errors[firstErrorField!];

  return {
    isValid,
    errors,
    firstErrorMessage,
    firstErrorField,
  };
}

/**
 * Validates a US District / County / Region.
 */
export function validateDistrict(district?: string | null): string | null {
  if (!district || typeof district !== 'string') {
    return 'District / County is required.';
  }
  const trimmed = district.trim();
  if (trimmed.length < 2) {
    return 'District / County must be at least 2 characters.';
  }
  return null;
}

/**
 * Validates customer password strength.
 */
export function validatePassword(password?: string | null): string | null {
  if (!password || typeof password !== 'string') {
    return 'Password is required.';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return null;
}

export interface CustomerRegistrationData {
  name: string;
  phone: string;
  email: string;
  address: string;
  aptSuite?: string;
  city: string;
  district?: string;
  state: string;
  zipCode: string;
  password: string;
  confirmPassword?: string;
}

export function validateCustomerRegistration(
  data: Partial<CustomerRegistrationData>
): CheckoutValidationResult {
  const errors: Record<string, string> = {};

  const nameError = validateCustomerName(data.name);
  if (nameError) errors.name = nameError;

  const phoneError = validateCustomerPhone(data.phone);
  if (phoneError) errors.phone = phoneError;

  const emailError = validateCustomerEmail(data.email);
  if (emailError) errors.email = emailError;

  const addressError = validateStreetAddress(data.address);
  if (addressError) errors.address = addressError;

  const cityError = validateCity(data.city);
  if (cityError) errors.city = cityError;

  if (data.district !== undefined) {
    const districtError = validateDistrict(data.district);
    if (districtError) errors.district = districtError;
  }

  const stateError = validateState(data.state);
  if (stateError) errors.state = stateError;

  const zipError = validateZipCode(data.zipCode, data.state);
  if (zipError) errors.zipCode = zipError;

  const passError = validatePassword(data.password);
  if (passError) errors.password = passError;

  if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  const fieldKeys = Object.keys(errors);
  const isValid = fieldKeys.length === 0;
  const firstErrorField = isValid ? null : fieldKeys[0];
  const firstErrorMessage = isValid ? null : errors[firstErrorField!];

  return {
    isValid,
    errors,
    firstErrorMessage,
    firstErrorField,
  };
}

