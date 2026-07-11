import React from 'react'
import { COUNTRIES, flagEmoji } from '../utils/countries'

export default function PhoneInput({ phone, onPhoneChange, country, onCountryChange, required, placeholder }) {
  return (
    <div className="flex rounded-xl border border-gray-300 dark:border-slate-600 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-white dark:bg-slate-700">
      <select
        value={country || 'AR'}
        onChange={e => onCountryChange?.(e.target.value)}
        className="shrink-0 px-2 py-2 text-sm bg-gray-50 dark:bg-slate-600 border-r border-gray-300 dark:border-slate-500 text-gray-900 dark:text-white focus:outline-none cursor-pointer"
      >
        {COUNTRIES.map(c => (
          <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.dial}</option>
        ))}
      </select>
      <input
        type="tel"
        value={phone || ''}
        onChange={e => onPhoneChange?.(e.target.value)}
        required={required}
        placeholder={placeholder || 'Número de teléfono'}
        className="flex-1 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:outline-none"
      />
    </div>
  )
}
