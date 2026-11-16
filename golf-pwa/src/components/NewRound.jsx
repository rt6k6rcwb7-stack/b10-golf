import { useState } from 'react';

export default function NewRound({ courses, onStart, onCancel }) {
  const [courseId, setCourseId] = useState(courses[0]?.id);
  const [mode, setMode] = useState('18');
  const course = courses.find((c) => c.id === courseId);
  const modes = [
    { id: '18', label: '18 Löcher' },
    { id: 'front9', label: 'Front 9 (1–9)' },
    { id: 'back9', label: 'Back 9 (10–18)' },
  ];
  return (
    <div className="flex flex-col gap-5 p-4">
      <button className="self-start text-lg font-bold text-turf-800" onClick={onCancel}>‹ Zurück</button>
      <h1 className="text-3xl font-black">Neue Runde</h1>
      <div className="flex flex-col gap-2">
        <div className="label">Golfplatz</div>
        {courses.map((c) => (
          <button
            key={c.id}
            onClick={() => setCourseId(c.id)}
            className={`rounded-2xl border-2 p-4 text-left ${c.id === courseId ? 'border-turf-900 bg-turf-50' : 'border-neutral-300'}`}
          >
            <div className="text-xl font-bold">
              {c.name} {c.home && <span className="ml-1 rounded-md bg-turf-900 px-2 py-0.5 align-middle text-xs font-bold uppercase tracking-wider text-white">Heimatplatz</span>}
            </div>
            <div className="text-neutral-600">
              {c.location} · Par {c.holes.reduce((s, h) => s + h.par, 0)}
            </div>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <div className="label">Löcher</div>
        <div className="grid grid-cols-3 gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-2xl border-2 px-2 py-4 text-base font-bold ${m.id === mode ? 'border-turf-900 bg-turf-900 text-white' : 'border-neutral-300'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      {course?.note && <p className="rounded-2xl bg-neutral-100 p-3 text-sm text-neutral-800">{course.note}</p>}
      {course?.placeholderCoordinates && (
        <p className="rounded-2xl bg-amber-100 p-3 text-sm text-amber-950">
          Dieser Beispielplatz hat Platzhalter-GPS-Koordinaten. Die Distanzen sind erst mit echten Grün-Koordinaten in
          <code className="mx-1 font-mono">src/data/courses.json</code>
          korrekt.
        </p>
      )}
      <button className="btn-primary py-5 text-xl" disabled={!course} onClick={() => onStart(course, mode)}>
        Runde starten
      </button>
    </div>
  );
}
