"use client";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useExamLocale } from "./exam-locale";

/*
 * The exam pages' filter dropdown (chapter, subject, topic) on the shadcn Select (components/ui/select.tsx), replacing
 * native <select>s. "" means all; Base UI items need a non-empty value, so it travels as ALL. Labels go through the
 * Hindi exam dictionary, as ExamContent does for the rest of the page.
 */
const ALL = "__all__";

export function ExamSelect({ id, label, value, onChange, options, allLabel }: {
  id?: string; label: string; value: string; onChange: (value: string) => void; options: readonly string[]; allLabel: string;
}) {
  const { dictionary } = useExamLocale();
  const say = (text: string) => dictionary[text] ?? text;
  return <Select value={value || ALL} onValueChange={next => onChange(!next || next === ALL ? "" : String(next))}>
    <SelectTrigger id={id} aria-label={say(label)}
      className="h-12! w-full min-w-0 rounded-[14px] border-[#e6e2d6] bg-white px-4 text-[14.5px] font-semibold text-[#262624] shadow-[0_1px_2px_rgba(38,38,36,.05)] hover:border-[#d6c7b8] focus-visible:border-[#c96442] focus-visible:ring-[#c96442]/25 data-popup-open:border-[#c96442]">
      <SelectValue>{(current: string) => current === ALL || !current ? say(allLabel) : say(current)}</SelectValue>
    </SelectTrigger>
    <SelectContent alignItemWithTrigger={false} align="start" className="max-h-80 rounded-xl p-1">
      <SelectGroup>
        <SelectItem value={ALL} className="rounded-lg py-2 pl-2.5 text-[14px] font-semibold">{say(allLabel)}</SelectItem>
        {options.map(option => <SelectItem key={option} value={option} className="rounded-lg py-2 pl-2.5 text-[14px]">{say(option)}</SelectItem>)}
      </SelectGroup>
    </SelectContent>
  </Select>;
}
