## Purpose

Provides free-form notes that can be attached to any entity in the system (client, project, task, negotiation, payment, expense, milestone, epic, reminder, or standalone), plus a searchable notes index.

## ADDED Requirements

### Requirement: Note creation on any entity
The system SHALL allow the admin to create a note attached to a client, project, task, negotiation, payment, expense, milestone, epic, or reminder, or as a standalone note. A note SHALL have a body.

#### Scenario: Create a note on a client
- **WHEN** the admin adds a note with a body to a client
- **THEN** the note is saved and appears on the client's Notes tab

#### Scenario: Create a standalone note
- **WHEN** the admin creates a note without linking an entity
- **THEN** the note is saved and appears in the standalone notes index

#### Scenario: Note requires a body
- **WHEN** the admin submits an empty note
- **THEN** the system rejects the submission and shows a validation error

### Requirement: Note management
The system SHALL allow the admin to view, edit, and delete notes.

#### Scenario: Edit a note
- **WHEN** the admin edits a note's body
- **THEN** the change is saved and reflected wherever the note appears

#### Scenario: Delete a note
- **WHEN** the admin deletes a note
- **THEN** the note is removed from all views

### Requirement: Notes index
The system SHALL provide a searchable notes page grouping notes by entity type, showing each note's entity context.

#### Scenario: Search notes
- **WHEN** the admin searches the notes index
- **THEN** the system shows notes whose body matches the search term

#### Scenario: Notes grouped by type
- **WHEN** the admin opens the notes page
- **THEN** the system groups notes by their entity type (or standalone)
