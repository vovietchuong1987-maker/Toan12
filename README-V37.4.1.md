# Math12 Hub V37.4.1 — ID6 Hierarchy UX

V37.4.1 keeps the official ID6 taxonomy from V37.4 and changes the visible workflow to the exact hierarchy encoded in ID6.

Example: `2D1H2-2` = Grade 12 -> D (Algebra/Calculus) -> Chapter 1 -> H (Understanding) -> Lesson 2 -> Form 2.

## Main changes
- Bank filters: Chapter -> Lesson -> Form; dependent selects only show children of the selected parent.
- Official catalog: 6 chapter accordion; opening one chapter closes the others.
- Question editor: visible Chapter -> Lesson -> Form selectors; legacy 19 lesson / 57 mastery metadata remains hidden for compatibility.
- Official browser: selecting a chapter shows only that chapter's lessons/forms.
- Adds explicit id6Domain/id6Chapter/id6Lesson/id6Form metadata when questions are saved.

No Firestore migration is required.
