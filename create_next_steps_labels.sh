#!/bin/bash

# Create all labels used across phase scripts
echo "🏷️  Creating GitHub labels for next step phases..."

# ──────  EXTRA LABELS FOR NEXT-STEP ISSUES  ──────
gh label create "security"  --color "b60205" --description "Security / secrets work"                 2>/dev/null || true
gh label create "ux"        --color "cfd3d7" --description "User-experience polish"                  2>/dev/null || true
gh label create "design"    --color "d1bcff" --description "Visual / brand design"                   2>/dev/null || true
gh label create "data-viz"  --color "a2eeef" --description "Charts & data visualisation"             2>/dev/null || true
gh label create "testing"   --color "f9d0c4" --description "Unit / E2E tests"                        2>/dev/null || true
gh label create "ci"        --color "0e8a16" --description "Continuous-integration / pipelines"