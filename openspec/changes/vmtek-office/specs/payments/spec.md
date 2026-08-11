## Purpose

Tracks money coming into VMWTEK: payments with a lifecycle from expected (pending) through partially received to fully received, attachable to a project, client, or milestone, recorded per currency.

## ADDED Requirements

### Requirement: Payment CRUD
The system SHALL allow the admin to create, view, edit, and delete payments. A payment SHALL have an amount and currency, and SHALL have a status of `pending`, `partial`, or `received`. A payment MAY be linked to a client, a project, or a milestone; a payment with none of these links represents general income.

#### Scenario: Create a pending payment
- **WHEN** the admin creates a payment with an amount, currency, due date, and a linked project
- **THEN** the payment is created with status pending and appears in the payments list

#### Scenario: Create a general payment
- **WHEN** the admin creates a payment without linking a client, project, or milestone
- **THEN** the payment is created as general income

#### Scenario: Payment requires amount and currency
- **WHEN** the admin submits a payment without an amount or currency
- **THEN** the system rejects the submission and shows a validation error

### Requirement: Payment lifecycle
The system SHALL allow the admin to transition a payment from `pending` to `partial` to `received`, recording the received date on first receipt.

#### Scenario: Mark a payment as received
- **WHEN** the admin marks a pending payment as received
- **THEN** the payment status becomes received, its received date is recorded, and it is counted as income

#### Scenario: Record partial payment
- **WHEN** the admin records a partial payment against a pending payment
- **THEN** the payment status becomes partial and the amount received so far is tracked

#### Scenario: Complete a partial payment
- **WHEN** the admin marks a partial payment as received
- **THEN** the payment status becomes received and its received date is recorded

### Requirement: Payments list
The system SHALL display all payments with status, amount, currency, due date, and links, filterable by status, with pending payments highlighted.

#### Scenario: View all payments
- **WHEN** the admin opens the payments page
- **THEN** the system shows all payments with status, amount, currency, and due date

#### Scenario: Filter by status
- **WHEN** the admin filters payments by pending
- **THEN** the system shows only pending and partial payments

### Requirement: Pending payments visibility
The system SHALL surface pending and partial payments (money still owed to VMWTEK) with their due dates, sorted by overdue first.

#### Scenario: Overdue payment is listed first
- **WHEN** pending payments exist with different due dates
- **THEN** the system lists the most overdue (earliest due date) first

#### Scenario: Pending payments on dashboard
- **WHEN** the admin views the dashboard
- **THEN** the system shows pending and partial payments with due dates and per-currency totals
