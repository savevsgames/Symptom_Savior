# Changelog

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