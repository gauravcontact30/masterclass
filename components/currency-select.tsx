"use client";
import { MapPin } from "lucide-react";
import { CURRENCY_INFO, type Currency } from "@/lib/pricing";
import { CurrencyBadge } from "./currency-picker";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";

/**
 * The shadcn Select behind CurrencyPicker, loaded on its own so Base UI's Select and Floating UI stay out of the
 * landing page's first load. `local` is the currency where the visitor was located, marked "Your location".
 */
export default function CurrencySelect({ id, value, options, local, onChange, disabled, hi = false }: { id: string; value: Currency; options: Currency[]; local?: Currency; onChange: (currency: Currency) => void; disabled?: boolean; hi?: boolean }) {
  const name = (currency: Currency) => hi ? CURRENCY_INFO[currency].hiName : CURRENCY_INFO[currency].name;
  return <Select value={value} disabled={disabled} onValueChange={next => { if (next) onChange(next as Currency); }}>
    <SelectTrigger id={id} aria-label={hi ? "मुद्रा चुनें" : "Choose currency"} className="h-10! min-w-40 gap-2 rounded-xl border-[#d8d6cc] bg-white pl-1.5 pr-2.5 text-[13px] text-[#141413] shadow-[0_1px_2px_rgba(20,20,19,.06)] hover:border-[#d97757] focus-visible:border-[#d97757] focus-visible:ring-[#d97757]/30">
      <SelectValue>{(current: Currency) => <><CurrencyBadge currency={current} /><b className="font-semibold">{current}</b><span className="truncate text-[#6b6a65]">{name(current)}</span></>}</SelectValue>
    </SelectTrigger>
    <SelectContent alignItemWithTrigger={false} align="start" className="w-auto min-w-72 rounded-xl p-1">
      <SelectGroup>
        <SelectLabel className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6b6a65]">{hi ? "लोकप्रिय मुद्राएँ" : "Popular currencies"}</SelectLabel>
        {options.map(currency => <SelectItem key={currency} value={currency} className="gap-2.5 rounded-lg py-1.5 pl-1.5 text-[13px]">
          <CurrencyBadge currency={currency} />
          <b className="w-9 font-semibold">{currency}</b>
          <span className="text-[#6b6a65]">{name(currency)}</span>
          {currency === local && <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#eef6f0] px-2 py-0.5 text-[10.5px] font-semibold text-[#2f6b45]"><MapPin className="size-3!" aria-hidden="true" />{hi ? "आपका स्थान" : "Your location"}</span>}
        </SelectItem>)}
      </SelectGroup>
    </SelectContent>
  </Select>;
}
