import React from 'react';

export default function HighlightText({ text, search }) {
  if (!search || !text) return <>{text}</>;
  const str = String(text);
  const regex = new RegExp(`(${search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = str.split(regex);
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-primary/20 text-primary-dark font-medium rounded px-0.5 inline-block">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
