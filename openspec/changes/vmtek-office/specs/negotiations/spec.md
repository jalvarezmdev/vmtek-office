## Purpose

Tracks VMWTEK's sales pipeline before projects start: negotiation records with quoted amounts and an open/won/lost lifecycle, which can be converted into projects when won.

## ADDED Requirements

### Requirement: Negotiation CRUD
The system SHALL allow the admin to create, view, edit, and delete negotiations. A negotiation SHALL have a title and currency, and MAY have an amount, description, linked client, and expected close date.

#### Scenario: Create a negotiation
- **WHEN** the admin creates a negotiation with a title, amount, and currency
- **THEN** the negotiation is created and appears in the pipeline

#### Scenario: Edit a negotiation
- **WHEN** the admin edits a negotiation's amount or expected close date
- **THEN** the changes are saved and reflected in the pipeline

#### Scenario: Negotiation requires a title
- **WHEN** the admin submits a negotiation without a title
- **THEN** the system rejects the submission and shows a validation error

### Requirement: Negotiation lifecycle
The system SHALL track negotiation status as one of `open`, `won`, or `lost`, and SHALL allow the admin to transition between these statuses.

#### Scenario: Mark a negotiation won
- **WHEN** the admin marks an open negotiation as won
- **THEN** the negotiation status becomes won and it is removed from the open pipeline

#### Scenario: Mark a negotiation lost
- **WHEN** the admin marks an open negotiation as lost
- **THEN** the negotiation status becomes lost and it is removed from the open pipeline

#### Scenario: Reopen a negotiation
- **WHEN** the admin changes a won or lost negotiation back to open
- **THEN** the negotiation returns to the open pipeline

### Requirement: Convert won negotiation to project
The system SHALL allow the admin to create a project from a won negotiation, carrying over the client link.

#### Scenario: Create project from won negotiation
- **WHEN** the admin converts a won negotiation into a project
- **THEN** a project is created linked to that negotiation and its client

#### Scenario: Convert only won negotiations
- **WHEN** the admin attempts to convert a negotiation that is not won
- **THEN** the system refuses the conversion and shows an error

### Requirement: Pipeline overview
The system SHALL display negotiations grouped by status with the total pipeline value per currency for open negotiations.

#### Scenario: View pipeline
- **WHEN** the admin opens the negotiations page
- **THEN** the system shows open, won, and lost negotiations with the open pipeline value per currency
