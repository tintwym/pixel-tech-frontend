'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  MapPin,
  Monitor,
  Moon,
  Package,
  Sun,
  Trash2,
  UserRound,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { DeliveryAddress, PaymentMethod, UserProfile } from '@/types';
import { DELIVERY_ZONES } from '@/data/products';
import Select from '@/components/Select';
import { validateEmail, validateFullName } from '@/lib/authValidation';

type AccordionId = 'account' | 'addresses' | 'payments' | null;

const PAYMENT_PROVIDERS = [
  { value: 'kbzpay' as const, label: 'KBZPay Wallet' },
  { value: 'wavepay' as const, label: 'WavePay Wallet' },
  { value: 'ayapay' as const, label: 'AYA Pay Wallet' },
  { value: 'mmqr' as const, label: 'MMQR' },
  { value: 'mpu' as const, label: 'MPU Debit Card' },
];

type MobileProfilePanelProps = {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  onAddToast: (title: string, msg: string, type: 'success' | 'warning' | 'info') => void;
  onOpenOrders: () => void;
  onOpenNotifications: () => void;
  onSignOut: () => void;
  themePref: 'system' | 'light' | 'dark';
  isDarkMode: boolean;
  themeLabel: string;
  onToggleTheme: () => void;
};

function AccordionRow({
  id,
  openId,
  onToggle,
  icon: Icon,
  label,
  children,
}: {
  id: Exclude<AccordionId, null>;
  openId: AccordionId;
  onToggle: (id: Exclude<AccordionId, null>) => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  const open = openId === id;
  return (
    <div className="border-b border-[#0284c7]/10 dark:border-white/10 last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onToggle(id)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left cursor-pointer active:bg-black/[0.03] dark:active:bg-white/5"
      >
        <Icon className="w-5 h-5 text-[#0284c7] shrink-0" />
        <span className="flex-1 text-sm font-medium text-[#0f172a] dark:text-[#e7eef5]">{label}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#94a3b8] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MobileProfilePanel({
  profile,
  onUpdateProfile,
  onAddToast,
  onOpenOrders,
  onOpenNotifications,
  onSignOut,
  themePref,
  isDarkMode,
  themeLabel,
  onToggleTheme,
}: MobileProfilePanelProps) {
  const [openId, setOpenId] = useState<AccordionId>('account');
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [profileErrors, setProfileErrors] = useState<{ name?: string; email?: string }>({});
  const [didAttemptSave, setDidAttemptSave] = useState(false);

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    addressLine: '',
    city: 'Yangon',
    state: 'Yangon Region',
    zipCode: '',
    phone: '',
    zone: 'Yankin' as string,
  });

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    type: 'kbzpay' as PaymentMethod['type'],
    accountName: '',
    accountNumber: '',
  });

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
    setProfileErrors({});
    setDidAttemptSave(false);
  }, [profile.id, profile.name, profile.email]);

  const toggle = (id: Exclude<AccordionId, null>) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handleSaveBasicInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setDidAttemptSave(true);
    const next = {
      name: validateFullName(name) || undefined,
      email: validateEmail(email) || undefined,
    };
    const cleaned = Object.fromEntries(
      Object.entries(next).filter(([, v]) => !!v)
    ) as { name?: string; email?: string };
    setProfileErrors(cleaned);
    if (Object.keys(cleaned).length > 0) {
      onAddToast('Check your details', 'Please fix the highlighted fields.', 'warning');
      return;
    }
    onUpdateProfile({ ...profile, name: name.trim(), email: email.trim() });
    onAddToast('Profile Updated', 'Basic information saved successfully.', 'success');
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.name || !newAddress.addressLine || !newAddress.phone) {
      onAddToast('Incomplete Fields', 'Please fill out all required fields.', 'warning');
      return;
    }
    const created: DeliveryAddress = {
      id: 'addr_' + Date.now(),
      name: newAddress.name,
      addressLine: `${newAddress.addressLine} (${newAddress.zone})`,
      city: newAddress.city,
      state: newAddress.state,
      zipCode: newAddress.zipCode || '11201',
      phone: newAddress.phone,
      isDefault: profile.addresses.length === 0,
    };
    onUpdateProfile({ ...profile, addresses: [...profile.addresses, created] });
    setNewAddress({
      name: '',
      addressLine: '',
      city: 'Yangon',
      state: 'Yangon Region',
      zipCode: '',
      phone: '',
      zone: 'Yankin',
    });
    setShowAddAddress(false);
    onAddToast('Address Saved', 'Preferred delivery address added.', 'success');
  };

  const handleDeleteAddress = (id: string) => {
    let updated = profile.addresses.filter((a) => a.id !== id);
    if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
      updated = updated.map((a, i) => (i === 0 ? { ...a, isDefault: true } : a));
    }
    onUpdateProfile({ ...profile, addresses: updated });
    onAddToast('Address Removed', 'Preferred address has been deleted.', 'info');
  };

  const handleSetDefaultAddress = (id: string) => {
    onUpdateProfile({
      ...profile,
      addresses: profile.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
    });
    onAddToast('Default Updated', 'New default delivery address set.', 'success');
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayment.accountName || !newPayment.accountNumber) {
      onAddToast('Incomplete Fields', 'Please enter account holder name and details.', 'warning');
      return;
    }
    const created: PaymentMethod = {
      id: 'pay_' + Date.now(),
      type: newPayment.type,
      accountName: newPayment.accountName,
      accountNumber: newPayment.accountNumber,
      isDefault: profile.paymentMethods.length === 0,
      maskedCardNumber:
        newPayment.type === 'mpu'
          ? `•••• •••• •••• ${newPayment.accountNumber.slice(-4)}`
          : undefined,
    };
    onUpdateProfile({
      ...profile,
      paymentMethods: [...profile.paymentMethods, created],
    });
    setNewPayment({ type: 'kbzpay', accountName: '', accountNumber: '' });
    setShowAddPayment(false);
    onAddToast('Payment Method Saved', 'Payment configuration linked successfully.', 'success');
  };

  const handleDeletePayment = (id: string) => {
    let updated = profile.paymentMethods.filter((p) => p.id !== id);
    if (updated.length > 0 && !updated.some((p) => p.isDefault)) {
      updated = updated.map((p, i) => (i === 0 ? { ...p, isDefault: true } : p));
    }
    onUpdateProfile({ ...profile, paymentMethods: updated });
    onAddToast('Payment Deleted', 'Preferred billing method removed.', 'info');
  };

  const handleSetDefaultPayment = (id: string) => {
    onUpdateProfile({
      ...profile,
      paymentMethods: profile.paymentMethods.map((p) => ({
        ...p,
        isDefault: p.id === id,
      })),
    });
    onAddToast('Default Billing Saved', 'Preferred payment method updated.', 'success');
  };

  const fieldClass = (hasError?: boolean) =>
    [
      'w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-[#0f172a] outline-hidden dark:bg-[#0B1220] dark:text-[#e7eef5]',
      hasError
        ? 'border-red-400 ring-2 ring-red-400/25'
        : 'border-[#0284c7]/15 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25 dark:border-white/10',
    ].join(' ');

  return (
    <div>
      <div className="flex flex-col items-center text-center mb-6">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt=""
            className="h-20 w-20 rounded-full object-cover ring-2 ring-white dark:ring-white/10 shadow-sm"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e0f2fe] text-2xl font-semibold text-[#0284c7]">
            {(profile.name || 'P').charAt(0).toUpperCase()}
          </span>
        )}
        <p className="mt-3 font-display text-lg font-semibold text-[#0f172a] dark:text-[#e7eef5]">
          {profile.name}
        </p>
        <p className="text-sm text-[#64748b] dark:text-[#8a9eb0]">{profile.email}</p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white dark:bg-[#121a24] border border-[#0284c7]/10 dark:border-white/10">
        <AccordionRow
          id="account"
          openId={openId}
          onToggle={toggle}
          icon={UserRound}
          label="Account"
        >
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={themeLabel}
            className="w-full flex items-center gap-3 rounded-xl border border-[#0284c7]/12 dark:border-white/10 bg-mist dark:bg-[#0B1220] px-3 py-2.5 text-left cursor-pointer"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-[#121a24] border border-[#0284c7]/10 dark:border-white/10">
              {themePref === 'system' ? (
                <Monitor className="w-4 h-4 text-[#0284c7]" />
              ) : isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[#64748b]" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[#0f172a] dark:text-[#e7eef5]">
                Appearance
              </span>
              <span className="block text-xs text-[#64748b] dark:text-[#8a9eb0]">
                {themePref === 'system'
                  ? `System (${isDarkMode ? 'Dark' : 'Light'})`
                  : themePref === 'dark'
                    ? 'Dark'
                    : 'Light'}
                {' · '}tap to cycle
              </span>
            </span>
          </button>

          <form onSubmit={handleSaveBasicInfo} className="space-y-3" noValidate>
            <div>
              <label
                className={`mb-1 block text-[11px] font-semibold uppercase tracking-wider ${
                  profileErrors.name ? 'text-red-600' : 'text-[#64748b]'
                }`}
              >
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (didAttemptSave) {
                    setProfileErrors((prev) => ({
                      ...prev,
                      name: validateFullName(e.target.value) || undefined,
                    }));
                  }
                }}
                className={fieldClass(!!profileErrors.name)}
                aria-invalid={!!profileErrors.name}
              />
              {profileErrors.name && (
                <p className="mt-1.5 flex items-start gap-1 text-xs font-medium text-red-600" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {profileErrors.name}
                </p>
              )}
            </div>
            <div>
              <label
                className={`mb-1 block text-[11px] font-semibold uppercase tracking-wider ${
                  profileErrors.email ? 'text-red-600' : 'text-[#64748b]'
                }`}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (didAttemptSave) {
                    setProfileErrors((prev) => ({
                      ...prev,
                      email: validateEmail(e.target.value) || undefined,
                    }));
                  }
                }}
                className={fieldClass(!!profileErrors.email)}
                aria-invalid={!!profileErrors.email}
              />
              {profileErrors.email && (
                <p className="mt-1.5 flex items-start gap-1 text-xs font-medium text-red-600" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {profileErrors.email}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#0284c7] py-2.5 text-sm font-semibold text-white cursor-pointer hover:bg-[#0ea5e9]"
            >
              Save changes
            </button>
          </form>
        </AccordionRow>

        <AccordionRow
          id="addresses"
          openId={openId}
          onToggle={toggle}
          icon={MapPin}
          label="Addresses"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-[#64748b] dark:text-[#8a9eb0]">
              {profile.addresses.length} saved
            </p>
            {!showAddAddress && (
              <button
                type="button"
                onClick={() => setShowAddAddress(true)}
                className="text-xs font-bold text-[#0284c7] cursor-pointer"
              >
                + Add
              </button>
            )}
          </div>

          {showAddAddress && (
            <form
              onSubmit={handleAddAddress}
              className="space-y-2 rounded-xl border border-[#0284c7]/12 dark:border-white/10 bg-mist dark:bg-[#0B1220] p-3"
            >
              <input
                required
                placeholder="Label (Home, Office)"
                value={newAddress.name}
                onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                className={fieldClass()}
              />
              <Select
                size="sm"
                value={newAddress.zone}
                onChange={(zone) => setNewAddress({ ...newAddress, zone })}
                options={DELIVERY_ZONES}
                className="w-full"
              />
              <input
                required
                placeholder="Street address"
                value={newAddress.addressLine}
                onChange={(e) => setNewAddress({ ...newAddress, addressLine: e.target.value })}
                className={fieldClass()}
              />
              <input
                required
                type="tel"
                placeholder="Phone"
                value={newAddress.phone}
                onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                className={fieldClass()}
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  className="px-3 py-1.5 text-xs text-[#64748b] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0284c7] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          {profile.addresses.length === 0 ? (
            <p className="text-xs text-[#94a3b8] py-2">No addresses yet.</p>
          ) : (
            <div className="space-y-2">
              {profile.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`rounded-xl border p-3 ${
                    addr.isDefault
                      ? 'border-[#0284c7] bg-[#e0f2fe]/40 dark:bg-sky-950/20'
                      : 'border-[#0284c7]/10 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0f172a] dark:text-[#e7eef5]">
                        {addr.name}
                        {addr.isDefault && (
                          <span className="ml-2 text-[9px] font-bold uppercase text-[#0284c7]">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-[#64748b] dark:text-[#8a9eb0] leading-relaxed">
                        {addr.addressLine}
                      </p>
                      <p className="mt-0.5 text-xs font-mono text-[#94a3b8]">{addr.phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="p-1 text-red-500 cursor-pointer"
                      aria-label="Delete address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      className="mt-2 text-xs font-semibold text-[#0284c7] cursor-pointer"
                    >
                      Make default
                    </button>
                  )}
                  {addr.isDefault && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-[#64748b]">
                      <CheckCircle2 className="w-3 h-3 text-sky-500" /> Active default
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </AccordionRow>

        <AccordionRow
          id="payments"
          openId={openId}
          onToggle={toggle}
          icon={CreditCard}
          label="Payments"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-[#64748b] dark:text-[#8a9eb0]">
              {profile.paymentMethods.length} linked
            </p>
            {!showAddPayment && (
              <button
                type="button"
                onClick={() => setShowAddPayment(true)}
                className="text-xs font-bold text-[#0284c7] cursor-pointer"
              >
                + Link
              </button>
            )}
          </div>

          {showAddPayment && (
            <form
              onSubmit={handleAddPayment}
              className="space-y-2 rounded-xl border border-[#0284c7]/12 dark:border-white/10 bg-mist dark:bg-[#0B1220] p-3"
            >
              <Select
                size="sm"
                value={newPayment.type}
                onChange={(type) => setNewPayment({ ...newPayment, type })}
                options={PAYMENT_PROVIDERS}
                className="w-full"
              />
              <input
                required
                placeholder="Account holder name"
                value={newPayment.accountName}
                onChange={(e) => setNewPayment({ ...newPayment, accountName: e.target.value })}
                className={fieldClass()}
              />
              <input
                required
                placeholder="Account / phone / card number"
                value={newPayment.accountNumber}
                onChange={(e) => setNewPayment({ ...newPayment, accountNumber: e.target.value })}
                className={fieldClass()}
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddPayment(false)}
                  className="px-3 py-1.5 text-xs text-[#64748b] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0284c7] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          {profile.paymentMethods.length === 0 ? (
            <p className="text-xs text-[#94a3b8] py-2">No payment methods yet.</p>
          ) : (
            <div className="space-y-2">
              {profile.paymentMethods.map((pay) => (
                <div
                  key={pay.id}
                  className={`rounded-xl border p-3 ${
                    pay.isDefault
                      ? 'border-[#0284c7] bg-[#e0f2fe]/40 dark:bg-sky-950/20'
                      : 'border-[#0284c7]/10 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0f172a] dark:text-[#e7eef5] capitalize">
                        {pay.type}
                        {pay.isDefault && (
                          <span className="ml-2 text-[9px] font-bold uppercase text-[#0284c7]">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-[#64748b] dark:text-[#8a9eb0]">
                        {pay.accountName}
                      </p>
                      <p className="mt-0.5 text-xs font-mono text-[#94a3b8]">
                        {pay.maskedCardNumber || pay.accountNumber}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePayment(pay.id)}
                      className="p-1 text-red-500 cursor-pointer"
                      aria-label="Delete payment method"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {!pay.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultPayment(pay.id)}
                      className="mt-2 text-xs font-semibold text-[#0284c7] cursor-pointer"
                    >
                      Make default
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </AccordionRow>

        <button
          type="button"
          onClick={onOpenOrders}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left cursor-pointer active:bg-black/[0.03] dark:active:bg-white/5 border-t border-[#0284c7]/10 dark:border-white/10"
        >
          <Package className="w-5 h-5 text-[#0284c7] shrink-0" />
          <span className="flex-1 text-sm font-medium text-[#0f172a] dark:text-[#e7eef5]">
            Orders
          </span>
          <ChevronDown className="w-4 h-4 text-[#94a3b8] -rotate-90" />
        </button>
        <button
          type="button"
          onClick={onOpenNotifications}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left cursor-pointer active:bg-black/[0.03] dark:active:bg-white/5 border-t border-[#0284c7]/10 dark:border-white/10"
        >
          <Bell className="w-5 h-5 text-[#0284c7] shrink-0" />
          <span className="flex-1 text-sm font-medium text-[#0f172a] dark:text-[#e7eef5]">
            Notifications
          </span>
          <ChevronDown className="w-4 h-4 text-[#94a3b8] -rotate-90" />
        </button>
      </div>

      <button
        type="button"
        onClick={onSignOut}
        className="mt-8 w-full text-center text-sm font-medium text-red-500 dark:text-red-400 cursor-pointer py-2"
      >
        Sign out
      </button>
    </div>
  );
}
