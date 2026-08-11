## Purpose

Tracks money going out of VMWTEK: categorized expenses with an optional recurring flag, attachable to a project or client, recorded per currency, enabling cost visibility per project and month.

## ADDED Requirements

### Requirement: Expense CRUD
The system SHALL allow the admin to create, view, edit, and delete expenses. An expense SHALL have an amount, currency, date, and category (`software`, `hardware`, `subcontractors`, `marketing`, `travel`, `office`, `other`). An expense MAY be linked to a client or project; a link to neither represents general overhead.

#### Scenario: Create an expense
- **WHEN** the admin creates an expense with an amount, currency, date, and category
- **THEN** the expense is created and appears in the expenses list

#### Scenario: Link an expense to a project
- **WHEN** the admin creates an expense linked to a project
- **THEN** the expense is attributed to that project and appears in its Expenses tab

#### Scenario: Expense requires amount, currency, date, and category
- **WHEN** the admin submits an expense missing any required field
- **THEN** the system rejects the submission and shows a validation error

### Requirement: Recurring expenses
The system SHALL allow marking an expense as recurring with a frequency (`monthly`, `yearly`, or other). Recurring expenses SHALL display a recurring badge.

#### Scenario: Mark an expense recurring
- **WHEN** the admin marks a software expense as recurring monthly
- **THEN** the expense shows a recurring badge with its frequency

### Requirement: Expenses list
The system SHALL display all expenses with amount, currency, date, category, and links, filterable by category.

#### Scenario: View all expenses
- **WHEN** the admin opens the expenses page
- **THEN** the system shows all expenses with amount, currency, date, and category

#### Scenario: Filter by category
- **WHEN** the admin filters expenses by a category
- **THEN** the system shows only expenses in that category

### Requirement: Expense visibility in money overview
The system SHALL include expenses in the dashboard money overview, showing month-to-date spending per currency.

#### Scenario: Money overview includes expenses
- **WHEN** the admin views the dashboard money widget
- **THEN** the system shows received payments and expenses for the current month, per currency
