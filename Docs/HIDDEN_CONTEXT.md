# Development Context Profiles

This file defines development "profiles" that specify which files and folders to hide from the AI assistant's context when working on specific features. This improves focus and reduces cognitive load while maintaining access to essential schemas and interfaces.

## How to Use

1. Copy the relevant profile section below
2. Use it to configure your IDE or context management tool to hide the specified files/folders
3. Keep essential schema files and type definitions visible for reference

---

## AI Assistant Development Profile

**Focus**: Chat interface, AI integration, voice features, TxAgent communication

### Folders to Hide:
```
app/(tabs)/symptoms/
app/(tabs)/treatments/
app/(tabs)/doctor-visits/
app/(tabs)/profile/
app/add-symptom.tsx
app/add-treatment.tsx
app/add-doctor-visit.tsx
components/ui/SymptomCard.tsx
components/ui/TreatmentCard.tsx
components/ui/DoctorVisitCard.tsx
```

### Files to Keep Visible:
```
app/(tabs)/assistant.tsx
hooks/useProfile.ts (for context injection)
hooks/useSymptoms.ts (for context injection)
lib/supabase.ts
lib/config.ts
types/env.d.ts
SUPABASE_CONFIG.md (schema reference)
components/ui/BaseButton.tsx
components/ui/BaseTextInput.tsx
components/ui/BaseCard.tsx
components/ui/VoiceInput.tsx
utils/logger.ts
```

---

## Profile Management Development Profile

**Focus**: User profiles, medical history, personal information, health records

### Folders to Hide:
```
app/(tabs)/symptoms/
app/(tabs)/treatments/
app/(tabs)/doctor-visits/
app/(tabs)/assistant.tsx
app/add-symptom.tsx
app/add-treatment.tsx
app/add-doctor-visit.tsx
components/ui/SymptomCard.tsx
components/ui/TreatmentCard.tsx
components/ui/DoctorVisitCard.tsx
components/ui/VoiceInput.tsx
```

### Files to Keep Visible:
```
app/(tabs)/profile/
hooks/useProfile.ts
lib/supabase.ts
lib/config.ts
types/env.d.ts
SUPABASE_CONFIG.md (schema reference)
components/ui/BaseButton.tsx
components/ui/BaseTextInput.tsx
components/ui/BaseCard.tsx
utils/logger.ts
```

---

## Symptom Tracking Development Profile

**Focus**: Symptom logging, symptom history, symptom analytics

### Folders to Hide:
```
app/(tabs)/treatments/
app/(tabs)/doctor-visits/
app/(tabs)/profile/
app/(tabs)/assistant.tsx
app/add-treatment.tsx
app/add-doctor-visit.tsx
components/ui/TreatmentCard.tsx
components/ui/DoctorVisitCard.tsx
components/ui/VoiceInput.tsx
```

### Files to Keep Visible:
```
app/(tabs)/symptoms/
app/add-symptom.tsx
components/ui/SymptomCard.tsx
hooks/useSymptoms.ts
lib/supabase.ts
lib/config.ts
types/env.d.ts
SUPABASE_CONFIG.md (schema reference)
components/ui/BaseButton.tsx
components/ui/BaseTextInput.tsx
components/ui/BaseCard.tsx
utils/logger.ts
```

---

## Treatment Management Development Profile

**Focus**: Treatment tracking, medication management, treatment analytics

### Folders to Hide:
```
app/(tabs)/symptoms/
app/(tabs)/doctor-visits/
app/(tabs)/profile/
app/(tabs)/assistant.tsx
app/add-symptom.tsx
app/add-doctor-visit.tsx
components/ui/SymptomCard.tsx
components/ui/DoctorVisitCard.tsx
components/ui/VoiceInput.tsx
```

### Files to Keep Visible:
```
app/(tabs)/treatments/
app/add-treatment.tsx
components/ui/TreatmentCard.tsx
hooks/useSymptoms.ts
lib/supabase.ts
lib/config.ts
types/env.d.ts
SUPABASE_CONFIG.md (schema reference)
components/ui/BaseButton.tsx
components/ui/BaseTextInput.tsx
components/ui/BaseCard.tsx
utils/logger.ts
```

---

## Doctor Visits Development Profile

**Focus**: Medical appointments, visit tracking, healthcare provider management

### Folders to Hide:
```
app/(tabs)/symptoms/
app/(tabs)/treatments/
app/(tabs)/profile/
app/(tabs)/assistant.tsx
app/add-symptom.tsx
app/add-treatment.tsx
components/ui/SymptomCard.tsx
components/ui/TreatmentCard.tsx
components/ui/VoiceInput.tsx
```

### Files to Keep Visible:
```
app/(tabs)/doctor-visits/
app/add-doctor-visit.tsx
components/ui/DoctorVisitCard.tsx
hooks/useSymptoms.ts
lib/supabase.ts
lib/config.ts
types/env.d.ts
SUPABASE_CONFIG.md (schema reference)
components/ui/BaseButton.tsx
components/ui/BaseTextInput.tsx
components/ui/BaseCard.tsx
utils/logger.ts
```

---

## Analytics & Trends Development Profile

**Focus**: Data visualization, charts, insights, pattern recognition

### Folders to Hide:
```
app/(tabs)/profile/
app/(tabs)/assistant.tsx
app/add-symptom.tsx
app/add-treatment.tsx
app/add-doctor-visit.tsx
components/ui/VoiceInput.tsx
```

### Files to Keep Visible:
```
app/trends.tsx (when created)
app/(tabs)/symptoms/
app/(tabs)/treatments/
app/(tabs)/doctor-visits/
components/ui/SymptomCard.tsx
components/ui/TreatmentCard.tsx
components/ui/DoctorVisitCard.tsx
hooks/useSymptoms.ts
hooks/useProfile.ts (for context)
lib/supabase.ts
lib/config.ts
types/env.d.ts
SUPABASE_CONFIG.md (schema reference)
components/ui/BaseButton.tsx
components/ui/BaseTextInput.tsx
components/ui/BaseCard.tsx
utils/logger.ts
```

---

## Dashboard Development Profile

**Focus**: Main dashboard, overview screens, navigation, quick actions

### Folders to Hide:
```
app/(tabs)/profile/
app/(tabs)/assistant.tsx
app/add-symptom.tsx
app/add-treatment.tsx
app/add-doctor-visit.tsx
components/ui/VoiceInput.tsx
```

### Files to Keep Visible:
```
app/(tabs)/index.tsx
app/(tabs)/symptoms/
app/(tabs)/treatments/
app/(tabs)/doctor-visits/
components/ui/SymptomCard.tsx
components/ui/TreatmentCard.tsx
components/ui/DoctorVisitCard.tsx
hooks/useSymptoms.ts
hooks/useProfile.ts
lib/supabase.ts
lib/config.ts
types/env.d.ts
SUPABASE_CONFIG.md (schema reference)
components/ui/BaseButton.tsx
components/ui/BaseTextInput.tsx
components/ui/BaseCard.tsx
utils/logger.ts
```

---

## UI Components Development Profile

**Focus**: Base components, styling, design system, reusable UI elements

### Folders to Hide:
```
app/(tabs)/symptoms/
app/(tabs)/treatments/
app/(tabs)/doctor-visits/
app/(tabs)/profile/
app/(tabs)/assistant.tsx
app/add-symptom.tsx
app/add-treatment.tsx
app/add-doctor-visit.tsx
hooks/useSymptoms.ts
hooks/useProfile.ts
```

### Files to Keep Visible:
```
components/ui/
lib/theme.ts
lib/config.ts
types/env.d.ts
utils/logger.ts
app/(tabs)/index.tsx (for testing components)
```

---

## Authentication Development Profile

**Focus**: Login, signup, session management, route protection

### Folders to Hide:
```
app/(tabs)/symptoms/
app/(tabs)/treatments/
app/(tabs)/doctor-visits/
app/(tabs)/profile/
app/(tabs)/assistant.tsx
app/add-symptom.tsx
app/add-treatment.tsx
app/add-doctor-visit.tsx
components/ui/SymptomCard.tsx
components/ui/TreatmentCard.tsx
components/ui/DoctorVisitCard.tsx
components/ui/VoiceInput.tsx
```

### Files to Keep Visible:
```
app/(auth)/
app/_layout.tsx
app/index.tsx
hooks/useAuth.ts
contexts/AuthContext.tsx
lib/supabase.ts
lib/config.ts
types/env.d.ts
SUPABASE_CONFIG.md (auth schema reference)
components/ui/BaseButton.tsx
components/ui/BaseTextInput.tsx
components/ui/BaseCard.tsx
utils/logger.ts
```

---

## Configuration & Setup Development Profile

**Focus**: Environment setup, configuration, build settings, deployment

### Folders to Hide:
```
app/(tabs)/
app/(auth)/
components/ui/SymptomCard.tsx
components/ui/TreatmentCard.tsx
components/ui/DoctorVisitCard.tsx
components/ui/VoiceInput.tsx
hooks/useSymptoms.ts
hooks/useProfile.ts
hooks/useAuth.ts
```

### Files to Keep Visible:
```
package.json
app.json
metro.config.js
babel.config.js
tsconfig.json
.env.example
lib/config.ts
lib/supabase.ts
types/env.d.ts
utils/logger.ts
README.md
DEVELOPMENT_PLAN.md
SUPABASE_CONFIG.md
```

---

## Notes

- **Always keep visible**: Core configuration files, type definitions, and schema references
- **Schema files**: Keep `SUPABASE_CONFIG.md` and `types/env.d.ts` visible for all profiles
- **Base components**: Keep `BaseButton`, `BaseTextInput`, `BaseCard` visible for most profiles
- **Utilities**: Keep `utils/logger.ts` and `lib/` folder visible for debugging and configuration
- **Hooks**: Only hide hooks that are not relevant to the current development focus
- **Assets**: Image assets can generally be hidden unless working on UI/design

## Usage Tips

1. **Start broad, then narrow**: Begin with a general profile, then create more specific ones as needed
2. **Test incrementally**: Hide files gradually to ensure you don't lose essential context
3. **Document dependencies**: Note which files depend on hidden ones for future reference
4. **Regular review**: Periodically review and update profiles as the codebase evolves