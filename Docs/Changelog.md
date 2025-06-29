# Changelog

## Version 1.2.1 - 2025-06-28

### Added
- Agent awareness implementation to enable symptom logging via conversation
- Intent detection system for identifying when users want to log symptoms
- Natural language processing for extracting symptom details from conversation
- Symptom confirmation UI for reviewing extracted symptom data before saving
- Support for handling partial symptom information with follow-up questions

### Changed
- Enhanced AI Assistant to handle specialized intents beyond general Q&A
- Improved conversation flow with context-aware responses
- Updated message handling to detect and process symptom logging requests

### Fixed
- Improved error handling for symptom logging failures
- Better feedback when symptom information is incomplete

## Version 1.2.0 - 2025-06-27 2:28am MST

### Added
- Complete medical profile management system
- Personal information screen with physical measurements
- Medical history screen with conditions, medications, and allergies
- Profile completion tracking with visual progress indicator
- Health insights based on profile completeness

### Changed
- Updated Medical History screen to use neutral styling for conditions instead of error-red colors
- Improved profile completion percentage calculation to be based on section completion
- Enhanced Profile screen with better visual hierarchy and section status indicators

### Fixed
- Fixed profile data structure to match Supabase schema
- Corrected field names in useProfile hook (diagnosed_at instead of diagnosed_on)
- Removed unnecessary user_id field from satellite table operations
- Improved error handling in profile data operations