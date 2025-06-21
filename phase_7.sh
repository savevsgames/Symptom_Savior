# NEXT‑STEP ISSUES — generated 2025-06-21
gh issue create --title "Implement Symptom Detail View with edit/delete" --body "### Description\nCreate a dedicated screen at \`app/(tabs)/symptoms/[id].tsx\` that shows the full details of a logged symptom and supports:\n1. **Read** – display all fields (name, severity, triggers, notes, etc.)\n2. **Update** – inline or modal edit that persists changes via \`updateSymptom\` (Supabase).\n3. **Delete** – destructive action with confirm dialog.\n4. **Navigation** – tap on a SymptomCard pushes this screen; after delete pop back.\n5. **Design** – reuse BaseCard; severity chip coloured by value.\n\n### File paths\n- \`app/(tabs)/symptoms.tsx\` (add onPress)\n- **NEW**  \`app/(tabs)/symptoms/[id].tsx\`\n- \`hooks/useSymptoms.ts\` (ensure update / delete exported)\n\n### Acceptance\n- Screen renders for existing IDs.\n- CRUD operations round‑trip to Supabase and respect RLS.\n- Back navigation works on all platforms." --label "phase:1,frontend" 

gh issue create --title "Generate concise Health‑Profile summary string in Assistant" --body "### Goal\nInside \`Assistant\` component build a helper (\`getHealthContextSummary()\`) that returns a single string containing:\n- Full name (if present)\n- Calculated age (from DOB)\n- Gender\n- Comma‑separated *conditions*, *medications*, *allergies*\n- Recent (last 5) symptoms & treatments titles\n\nIt must gracefully skip missing sections and keep length \<= 500 chars.\n\n### Usage\nReplace current verbose context object sent to TxAgent with:\n\`\`\`ts
context_summary: getHealthContextSummary()
\`\`\`\nwhile still sending structured JSON in parallel for richer models.\n\n### Acceptance\n- Unit test with full + partial profile cases.\n- Summary appears in network payload and never breaks on null fields." --label "phase:4,ai,frontend"


# Creating issue in savevsgames/Symptom_Savior
# https://github.com/savevsgames/Symptom_Savior/issues/27
# Creating issue in savevsgames/Symptom_Savior
# https://github.com/savevsgames/Symptom_Savior/issues/28