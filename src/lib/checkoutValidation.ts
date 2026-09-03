//
// Shared checkout / profile field validation (Myanmar phone + delivery forms).
//

export type AddressFieldErrors = {
  name?: string;
  addressLine?: string;
  phone?: string;
  zipCode?: string;
  zone?: string;
};

export type PaymentFieldErrors = {
  accountName?: string;
  accountNumber?: string;
};

export type FeedbackFieldErrors = {
  rating?: string;
  comment?: string;
};

const ZIP_MM = /^\d{4,6}$/;
const MPU_CARD = /^\d{13,19}$/;

export function validateRecipientName(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return 'Please enter the recipient name.';
  if (trimmed.length < 2) return 'Recipient name looks too short.';
  if (trimmed.length > 80) return 'Recipient name is too long.';
  return undefined;
}

export function validateAddressLine(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return 'Please enter a delivery address.';
  if (trimmed.length < 8) return 'Address looks incomplete — add street and township.';
  if (trimmed.length > 200) return 'Address is too long.';
  return undefined;
}

/** Myanmar mobile: 09xxxxxxxx (+95 optional). */
export function validateMyanmarPhone(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return 'Please enter a contact phone number.';
  let digits = trimmed.replace(/[\s\-()]/g, '');
  if (digits.startsWith('+95')) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith('95') && digits.length >= 11) digits = `0${digits.slice(2)}`;
  if (!/^09\d{7,9}$/.test(digits)) {
    return 'Use a Myanmar mobile number (e.g. 09xxxxxxxxx).';
  }
  return undefined;
}

export function validateZipCode(value: string, required = false): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return required ? 'Please enter a zip / postal code.' : undefined;
  if (!ZIP_MM.test(trimmed)) return 'Zip code should be 4–6 digits.';
  return undefined;
}

export function validateDeliveryZone(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return 'Please select a delivery zone.';
  return undefined;
}

export function validateManualAddress(values: {
  name: string;
  addressLine: string;
  phone: string;
  zipCode?: string;
  zone: string;
}): AddressFieldErrors {
  const errors: AddressFieldErrors = {
    name: validateRecipientName(values.name),
    addressLine: validateAddressLine(values.addressLine),
    phone: validateMyanmarPhone(values.phone),
    zipCode: validateZipCode(values.zipCode ?? ''),
    zone: validateDeliveryZone(values.zone),
  };
  (Object.keys(errors) as (keyof AddressFieldErrors)[]).forEach((key) => {
    if (!errors[key]) delete errors[key];
  });
  return errors;
}

export function validatePaymentHolder(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return 'Please enter the account / card holder name.';
  if (trimmed.length < 2) return 'Holder name looks too short.';
  return undefined;
}

export function validatePaymentAccount(
  value: string,
  type: string
): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return type === 'mpu'
      ? 'Please enter the card number.'
      : 'Please enter the wallet phone or account number.';
  }
  if (type === 'mpu') {
    const digits = trimmed.replace(/\s+/g, '');
    if (!MPU_CARD.test(digits)) return 'MPU card number should be 13–19 digits.';
    return undefined;
  }
  if (type === 'apple_pay' || type === 'google_pay' || type === 'mmqr' || type === 'digital_wallet') {
    return undefined;
  }
  return validateMyanmarPhone(trimmed);
}

export function validateManualPayment(values: {
  type: string;
  accountName: string;
  accountNumber: string;
}): PaymentFieldErrors {
  if (values.type === 'apple_pay' || values.type === 'google_pay' || values.type === 'mmqr') {
    return {};
  }
  const errors: PaymentFieldErrors = {
    accountName: validatePaymentHolder(values.accountName),
    accountNumber: validatePaymentAccount(values.accountNumber, values.type),
  };
  (Object.keys(errors) as (keyof PaymentFieldErrors)[]).forEach((key) => {
    if (!errors[key]) delete errors[key];
  });
  return errors;
}

export function validateCouponCode(value: string): string | undefined {
  const clean = value.trim().toUpperCase();
  if (!clean) return 'Enter a coupon code first.';
  if (!/^[A-Z0-9]{4,16}$/.test(clean)) {
    return 'Coupon codes use 4–16 letters or numbers.';
  }
  return undefined;
}

export function validateFeedback(
  rating: number,
  comment: string
): FeedbackFieldErrors {
  const errors: FeedbackFieldErrors = {};
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    errors.rating = 'Please choose a rating from 1 to 5 stars.';
  }
  const trimmed = comment.trim();
  if (trimmed.length > 500) {
    errors.comment = 'Comment must be 500 characters or fewer.';
  } else if (trimmed.length > 0 && trimmed.length < 3) {
    errors.comment = 'Comment looks too short — add a bit more detail or leave it blank.';
  }
  return errors;
}

export function hasFieldErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
