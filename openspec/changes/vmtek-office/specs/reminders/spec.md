## Purpose

Provides in-app due-date reminders that can be attached to any entity (client, project, task, payment, negotiation, milestone, or standalone), with repeat and dismissal, surfaced on the dashboard and a reminders page.

## ADDED Requirements

### Requirement: Reminder CRUD
The system SHALL allow the admin to create, view, edit, and delete reminders. A reminder SHALL have a title and a due datetime, and MAY have notes. A reminder MAY be attached to a client, project, task, payment, negotiation, or milestone, or MAY be standalone.

#### Scenario: Create a reminder on a client
- **WHEN** the admin creates a reminder with a title, due datetime, and a linked client
- **THEN** the reminder is created and appears on the reminders page and the client's Reminders tab

#### Scenario: Create a standalone reminder
- **WHEN** the admin creates a reminder without linking an entity
- **THEN** the reminder is created as standalone

#### Scenario: Reminder requires a title and due datetime
- **WHEN** the admin submits a reminder without a title or due datetime
- **THEN** the system rejects the submission and shows a validation error

### Requirement: Reminder lifecycle
The system SHALL track reminder status as `pending`, `done`, or `dismissed`, and SHALL allow the admin to complete or dismiss a reminder.

#### Scenario: Complete a reminder
- **WHEN** the admin marks a reminder as done
- **THEN** the reminder is removed from pending views

#### Scenario: Dismiss a reminder
- **WHEN** the admin dismisses a reminder
- **THEN** the reminder is removed from pending views and marked dismissed

### Requirement: Repeating reminders
The system SHALL allow a reminder to repeat `once`, `daily`, `weekly`, or `monthly`. When a repeating reminder is completed, the system SHALL create the next occurrence.

#### Scenario: Complete a repeating reminder
- **WHEN** the admin completes a weekly repeating reminder
- **THEN** the system creates a new pending reminder due one week later

#### Scenario: Non-repeating reminder has no next occurrence
- **WHEN** the admin completes a once-only reminder
- **THEN** no new reminder is created

### Requirement: Reminders page
The system SHALL display upcoming and overdue reminders grouped by due date.

#### Scenario: View reminders
- **WHEN** the admin opens the reminders page
- **THEN** the system shows overdue reminders first, then upcoming reminders grouped by due date

#### Scenario: Overdue reminder highlighted
- **WHEN** a reminder's due datetime has passed and it is still pending
- **THEN** the system marks it overdue and shows it prominently

### Requirement: Reminders on dashboard
The system SHALL show today's due and overdue reminders on the dashboard with a quick complete action.

#### Scenario: Dashboard shows due reminders
- **WHEN** the admin views the dashboard
- **THEN** the system lists reminders due today and overdue with a complete button
