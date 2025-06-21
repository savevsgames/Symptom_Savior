# NEXT‑STEP ISSUES PT 2 — generated 2025-06-21
gh issue create --title "Secure ElevenLabs integration by moving API key to backend" --body "### Problem\nThe ElevenLabs API key is currently exposed in the client (\`lib/api.ts → transcribeAudio\`).\n\n### Tasks\n1. **Backend endpoint**  (e.g. \`POST /api/voice/transcribe\`) that accepts audio, forwards to ElevenLabs using the **server‑side** key, and returns the transcript.\n2. Mirror for TTS if/when used.\n3. Remove key from client bundle; front‑end now calls the proxy endpoint.\n4. Update env docs to note key is server‑only.\n5. Add simple rate‑limit / auth check (Supabase JWT).\n\n### Acceptance\n- No ElevenLabs key in JS bundle (verified via \`grep\`).\n- Voice input still works in Assistant when ENABLE_VOICE=true.\n- Requests logged server‑side." --label "phase:3,security,backend"

gh issue create --title "Add floating‑label behaviour to BaseTextInput" --body "### Description\nImplement material‑style floating labels inside \`components/ui/BaseTextInput.tsx\`.  When the field is focused or has value, the placeholder animates to a small label above the input.\nUse React‑Native‑Reanimated for smooth opacity/translateY.\n\nUpdate Personal‑Info & Medical‑History screens to pass \`label\` prop instead of inline Text.\n\n### Acceptance\n- Works on iOS, Android, Web.\n- No layout shift in existing forms.\n- Dark‑mode colours consistent with theme." --label "phase:1,ux"

gh issue create --title "Integrate Pexels hero images & Reanimated page transitions" --body "### Description\nEnhance visual appeal by:\n1. Fetching royalty‑free health imagery from Pexels REST (API key already in env).  Display a blurred hero background on Dashboard & Trends screens.\n2. Use Reanimated shared‑element or fade/slide transitions when navigating between main tabs and detail screens.\n3. Ensure images are cached & have low‑res preview to avoid jank.\n\n### Acceptance\n- Lighthouse web score unaffected (lazy‑loaded).\n- Transitions run at 60 fps on mid‑range Android.\n- Feature is behind \`ENABLE_PEXELS=true\` flag." --label "phase:1,frontend,ux"

gh issue create --title "Apply colour‑coded metrics & risk indicators across UI" --body "### Description\nUse theme tokens to display metric chips (green/amber/red) based on value thresholds:\n- Symptom severity chips\n- BMI indicator on Personal‑Info\n- Trends insights badges \nAdd helper util \`getRiskColour(value, type)\`.\n\n### Acceptance\n- Colours match accessibility contrast ratio \>= 4.5.\n- Chips update live on value change." --label "phase:2,design"

gh issue create --title "Interactive drill‑down & animation for Trends charts" --body "### Description\nUpgrade Trends screen charts with:\n- Tap/hover to show exact values.\n- Toggle between bar/line views.\n- Reanimated spring‑in on data refresh.\nConsider using victory‑native or upgrade current custom components.\n\n### Acceptance\n- Interactions work on touch & mouse.\n- No noticeable jank for 1k datapoints." --label "phase:5,frontend,data-viz"

gh issue create --title "Add automated E2E & unit tests for symptom flow and AI chat" --body "### Description\nIntroduce testing suite:\n- Jest + @testing‑library/react‑native for unit tests.\n- Playwright (Expo Web) or Detox (native) for E2E.\nCover:\n1. Add / edit / delete symptom.\n2. Emergency alert path.\n3. AI chat happy path & offline fallback.\n\nCI: add GitHub action to run tests on PR.\n\n### Acceptance\n- Tests pass locally & in CI.\n- Coverage \>= 60% lines." --label "phase:0,testing,ci"



# Creating issue in savevsgames/Symptom_Savior
# https://github.com/savevsgames/Symptom_Savior/issues/29
# Creating issue in savevsgames/Symptom_Savior
# https://github.com/savevsgames/Symptom_Savior/issues/30
# Creating issue in savevsgames/Symptom_Savior
# https://github.com/savevsgames/Symptom_Savior/issues/31
# Creating issue in savevsgames/Symptom_Savior
# https://github.com/savevsgames/Symptom_Savior/issues/32
# Creating issue in savevsgames/Symptom_Savior
# https://github.com/savevsgames/Symptom_Savior/issues/33
# Creating issue in savevsgames/Symptom_Savior
# https://github.com/savevsgames/Symptom_Savior/issues/34