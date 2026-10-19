/** Sets the *starred* words of a title in the italic Scripture serif, so headings carry the voice of the Word. */
export function Accent({ text }: { text: string }) {
  return <>{text.split('*').map((part, i) => i % 2 ? <em key={i}>{part}</em> : part)}</>;
}
