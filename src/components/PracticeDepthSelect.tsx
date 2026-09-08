import type { PracticeDepth } from "@/src/lib/term2/practice-depth.mjs";

export function PracticeDepthSelect({ value, onChange }: { value: PracticeDepth; onChange: (value: PracticeDepth) => void }) {
  return <label><span>Question depth</span><select value={value} onChange={(event) => onChange(event.target.value as PracticeDepth)}>
    <option value="all">Core + challenge</option>
    <option value="core">Core · difficulty 1–3</option>
    <option value="challenge">Challenge · difficulty 4–5</option>
  </select></label>;
}
