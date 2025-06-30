# Changelog

## Version 1.2.4 - 2025-06-30

### Added
- Added metadata field to user_symptoms table in database schema
- Added additional indexes for user_symptoms table including symptom_name index
- Added comprehensive indexing for better query performance

### Fixed
- Fixed blood_type enum values to use proper dash character instead of hyphen
- Updated migration file to be consistent with the schema in SUPABASE_CONFIG.md

## Version 1.2.3 - 2025-06-30

### Fixed
- Corrected field name references in user context building to match Supabase schema
- Changed profile.blood_group to profile.blood_type
- Changed c.diagnosed_on to c.diagnosed_at within the medical_conditions mapping
- Changed m.dose to m.dosage within the current_medications mapping
- Changed m.started_on to m.start_date within the current_medications mapping
- Changed m.prescribing_doctor to m.prescribed_by within the current_medications mapping
- Updated API documentation to reflect the corrected field names

## Version 1.2.2 - 2025-06-29

### Added
- Symptom history retrieval through conversation
- Enhanced intent detection with more patterns for better accuracy
- Support for retrieving specific symptom history by name
- Improved symptom extraction with additional patterns for better natural language understanding
- Pre-filling add symptom form when editing from conversation

### Changed
- Expanded intent detection to recognize symptom history queries
- Enhanced symptom extraction to handle more natural language variations
- Improved confidence calculation for more accurate intent detection
- Updated add-symptom screen to accept pre-filled parameters from conversation

### Fixed
- Corrected field name references in user context building (diagnosed_at, dosage)
- Improved error handling for symptom history retrieval
- Enhanced symptom name extraction with better pattern matching

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