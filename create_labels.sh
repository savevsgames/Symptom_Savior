#!/bin/bash

# Create all labels used across phase scripts
echo "🏷️  Creating GitHub labels for all phases..."

# Create labels with custom colors (ignoring errors if they already exist)
gh label create "phase:0" --color "0052cc" --description "Phase 0: Dev Tools and Base Setup" 2>/dev/null || true
gh label create "phase:1" --color "1d76db" --description "Phase 1: Project Scaffolding and Authentication" 2>/dev/null || true
gh label create "phase:2" --color "0366d6" --description "Phase 2: Core Symptom Tracking" 2>/dev/null || true
gh label create "phase:3" --color "7057ff" --description "Phase 3: AI and Voice Features" 2>/dev/null || true
gh label create "phase:4" --color "8b949e" --description "Phase 4: Profile & Context Injection" 2>/dev/null || true
gh label create "phase:5" --color "bf8700" --description "Phase 5: Analytics & Insights" 2>/dev/null || true
gh label create "phase:6" --color "d73a4a" --description "Phase 6: Future Extensions" 2>/dev/null || true

# Technology and component labels
gh label create "frontend" --color "e99695" --description "Frontend development work" 2>/dev/null || true
gh label create "backend" --color "5319e7" --description "Backend and API development" 2>/dev/null || true
gh label create "ai" --color "00d4aa" --description "AI and machine learning features" 2>/dev/null || true
gh label create "voice" --color "ff6b6b" --description "Voice input/output features" 2>/dev/null || true
gh label create "expo" --color "000020" --description "Expo and React Native related" 2>/dev/null || true
gh label create "typescript" --color "007acc" --description "TypeScript development" 2>/dev/null || true
gh label create "supabase" --color "3ecf8e" --description "Supabase database and auth" 2>/dev/null || true
gh label create "auth" --color "ffa500" --description "Authentication and authorization" 2>/dev/null || true
gh label create "RLS" --color "ff9500" --description "Row Level Security policies" 2>/dev/null || true
gh label create "schema" --color "6f42c1" --description "Database schema changes" 2>/dev/null || true

echo "✅ All labels created successfully!"
echo ""
echo "📋 Created labels:"
echo "   Phase labels: phase:0 through phase:6"
echo "   Tech labels: frontend, backend, ai, voice, expo, typescript, supabase, auth, RLS, schema"
echo ""
echo "🚀 Ready to run phase_0 to phase_6 scripts!"