# Changelog

All notable changes to this project will be documented in this file.

## [3.3.2]

### Added

- Request a users seat number for self request mode

### Changed

- Fixed Filtering on Times
- Moved URL decleration to .env file for sending emails

## [3.3.1]

### Added

### Changed

- Renamed qwiklabs types

## [3.3.0]

### Added

- ENV View in Classes Tab

### Changed

- Email Reloads from text file everytime a request is made - no restart needed when file is changed
- Hot Envs name start with Class ID
- Hot Envs are tied to a class
- Hot Tab does not show up in class mode

## [3.2.2]

### Added

### Changed

- Fixed Bug where a hot class user does not show as "accessed portal"
- Started rollout "block-delay" from beginning of previous block instead of end
- Fixed Bug where application would throw exception on login when no credentials were passed

## [3.2.1]

### Added

- Added Ignite Europe logo
- Add resource group text to azure lab page

### Changed

- Fixed createAdmin and createSettings Scripts
- Edited Email Text
- Removed Button From Azure for ignite 18 europe mutli cloud lab
- Fix bug when no lab is made and self request mode
- Add Deletion buffer to hot standby classes
- Change login flow when qwiklabs lab is selected
- Fixed bug with custom lab
- Fixed bug with Cloudshare regions
- Do Not display login Button when cloudshare lab is selected

## [3.2.0]

### Added

- Add Qwiklabs integration
- Option to set time after class for deletion
- Auto Refresh of Admin Tables

### Changed

- Made the checkboxes on user request and register an optional setting
- Implemented some of Tudip's suggested code changes
- Publish Takes Priority over deletion
- Base URL variable for ravello to allow for easy API mocking for testing
- Sort on Lab dropdown
- UI Changes on Request View

## [3.1.6]

### Added

### Changed

- Fix lowercase username login issue

## [3.1.5]

### Added

- Added Status to Hot Start Rollout

### Changed

- Fix Hot Start rollout naming issues

## [3.1.4]

### Added

### Changed

- Fix Race Condition when Hot Start Group is deleted and ENV is in the process of spinning up

## [3.1.3]

### Added

- Ability to use latest snapshot instead of default for cloudshare invites

### Changed

- Fixed Race Condition on Hot Start login

## [3.1.2]

### Added

### Changed

- Fixed Issue with Timezones and class Scheduling

## [3.1.1]

### Added

### Changed

- Fixed Issue where duration would change when editing class

## [3.1.0]

### Added

- Ability to Generate a "Blank" Lab which displays a markdown file to the student
- Update DateTime picker for better UX
- Reformat HotStart and Pre-Gen ENVs to use a 3 digit ID to allow for larger classes
- Add Random String to end of hot start ENVS to allow multiple groups of the same blueprint in different regions

### Changed
