## Purpose

Manages the clients (companies or people) VMWTEK works with, storing their contact details and providing an overview of their related projects, negotiations, payments, and outstanding balances.

## ADDED Requirements

### Requirement: Client CRUD
The system SHALL allow the admin to create, view, edit, and delete clients. A client SHALL have a name and MAY have company, email, phone, and address.

#### Scenario: Create a client
- **WHEN** the admin submits a new client with a name
- **THEN** the client is created and appears in the clients list

#### Scenario: Edit a client
- **WHEN** the admin edits an existing client's contact details
- **THEN** the changes are saved and reflected on the client detail page

#### Scenario: Delete a client
- **WHEN** the admin deletes a client
- **THEN** the client is removed from the list

#### Scenario: Client requires a name
- **WHEN** the admin submits a client without a name
- **THEN** the system rejects the submission and shows a validation error

### Requirement: Client list overview
The system SHALL display all clients in a list with their name, company, active project count, open negotiation count, and outstanding balance (sum of pending/partial payments).

#### Scenario: View client list
- **WHEN** the admin opens the clients page
- **THEN** the system shows a table of all clients with name, company, active projects, open negotiations, and outstanding balance

#### Scenario: Empty clients list
- **WHEN** no clients exist yet
- **THEN** the system shows an empty state with a call to create the first client

### Requirement: Client detail page
The system SHALL provide a client detail page with the client's information and tabbed views of their projects, negotiations, payments, expenses, notes, and reminders.

#### Scenario: Open client detail
- **WHEN** the admin opens a client's detail page
- **THEN** the system shows the client info plus tabs for Projects, Negotiations, Payments, Expenses, Notes, and Reminders

#### Scenario: Client not found
- **WHEN** the admin requests a client id that does not exist
- **THEN** the system shows a not-found page
