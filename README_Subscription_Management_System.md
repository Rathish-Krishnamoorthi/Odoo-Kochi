# Subscription Management System

> **A centralized platform to manage products, plans, customers,
> subscriptions, recurring invoices, payments, discounts, and revenue
> reports.**

## 1. Project Overview

Brightloop Software sells products and services through monthly and
yearly subscriptions. It also offers add-ons and product variants. As
the business grows, managing every customer, renewal, invoice, payment,
and report manually becomes difficult.

The Subscription Management System is a web application designed to
bring these activities into one place. Administrators manage the
business setup, staff handle daily operations, and customers use a
self-service portal to view and manage their own subscriptions and
invoices.

**Main goal:** Reduce manual work, prevent billing mistakes and missed
renewals, and give the business a clear view of its recurring revenue.

## 2. The Problem

The challenge describes a company that currently handles important work
manually:

  -----------------------------------------------------------------------
  Current process                     Problem
  ----------------------------------- -----------------------------------
  Customer subscriptions are tracked  Information can become outdated or
  in spreadsheets                     difficult to find

  Renewals are remembered by          Renewals can be missed
  employees                           

  Invoices are typed manually every   The process takes time and can
  month                               cause errors

  Payments are matched using bank     It is difficult to know which
  statements                          invoice a payment belongs to

  Revenue reports are prepared        Management cannot quickly see the
  manually                            financial position
  -----------------------------------------------------------------------

As a result, the company may send incorrect invoices, miss renewals,
fail to follow up on unpaid invoices, or struggle to calculate recurring
revenue.

### Example

Suppose 1,000 customers have subscriptions. The finance team needs to
know:

-   How many subscriptions are active?
-   Which subscriptions are due for renewal?
-   Which invoices have been paid?
-   Which invoices are overdue?
-   How much revenue was received?
-   How much money is still owed?

Doing this manually takes too much time. The proposed platform stores
the information centrally and makes it easier to track.

## 3. Our Solution

We propose a **Subscription Management System** with three types of
users:

1.  **Admin:** Controls the complete system, creates staff accounts,
    manages products, plans, taxes, discounts, and views reports.
2.  **Staff:** Handles permitted day-to-day customer, subscription,
    invoice, and payment operations.
3.  **Customer:** Uses a self-service portal to view their own
    subscriptions and invoices.

The system connects the full subscription process:

1.  A customer registers and signs in.
2.  The customer chooses an available subscription plan.
3.  The system creates a subscription with its dates, plan, customer,
    payment terms, and items.
4.  The subscription moves through its defined status stages.
5.  When billing is due, the system creates an invoice from the
    subscription.
6.  The customer makes a payment through an available payment method.
7.  The payment is recorded against the correct invoice.
8.  The dashboard displays subscription, payment, and revenue
    information.

## 4. Main Features and Modules

### 4.1 Authentication and User Roles

-   Customer registration and login.
-   Each email address can belong to only one account.
-   Password validation: more than eight characters, with uppercase,
    lowercase, and a special character.
-   Password reset through a link sent to the registered email.
-   Role-based access for Admin, Staff, and Customer.
-   Only the Admin can create staff accounts.
-   Customers can access only their own subscriptions and invoices.

### 4.2 Product and Variant Management

The Admin can create and manage products with:

-   Product name and type.
-   Sales price and cost price.
-   Notes or description.
-   Product variants, such as brand or edition.
-   Additional variant pricing.

**Example:** If the base product costs ₹1,000 and selecting a particular
brand adds ₹560, the system calculates the final product price as
₹1,560.

### 4.3 Subscription Plan Management

The Admin can configure plans with:

-   Plan name and linked product.
-   Price and billing frequency.
-   Billing frequency: daily, weekly, monthly, or yearly.
-   Minimum quantity.
-   Availability start and end dates.
-   Rules for automatic closure, early closure, pause, and renewal.

This lets the company offer different plans to different customer types.

### 4.4 Quotation and Subscription Lifecycle

Staff can create a quotation using a reusable quotation template. The
template contains product and plan lines and remains valid for a
configured number of days.

Each subscription stores:

-   Unique subscription number.
-   Customer and selected plan.
-   Start date and expiry date.
-   Payment terms.
-   Product lines, quantities, unit prices, taxes, and amounts.

The required lifecycle is:

`Draft → Quotation → Confirmed → Active → Closed`

The team can see the current status of each subscription.

### 4.5 Automatic Invoice and Billing Management

-   Generate invoices from subscriptions when billing is due.
-   Fill invoices with customer details, product lines, quantities,
    taxes, and totals.
-   Calculate taxes using rules configured by the Admin.
-   Support invoice actions such as confirm, cancel, send, and print.
-   Track invoice status: `Draft → Confirmed → Paid`.
-   Prevent duplicate billing and avoid skipping due invoices.

The billing scheduler and duplicate-prevention logic are important
implementation areas. A billing job should identify due subscriptions,
create the correct invoice once, and record that the billing period has
been processed.

### 4.6 Discount Management

Only the Admin can create discount rules.

Supported rule settings:

-   Fixed-amount or percentage discount.
-   Minimum purchase amount or minimum quantity.
-   Start and end dates.
-   Maximum number of uses.
-   Applicable products or entire subscriptions.

Eligible discounts should be applied automatically to the next invoice.
The system should stop applying a discount when it expires or reaches
its usage limit.

### 4.7 Payment Management

Record each payment with:

-   Payment method.
-   Amount.
-   Payment date.
-   Notes or reference details.
-   Related invoice.

The team can identify paid and outstanding invoices and follow up on
overdue amounts.

A payment gateway can be integrated for online payments. Manual or
offline payment recording should also be supported where required.
Payment status should be updated only after a verified payment result.

### 4.8 Dashboard and Revenue Reports

Provide a central dashboard with:

-   Total active subscriptions.
-   Revenue received.
-   Outstanding amount.
-   Overdue invoices.
-   Payment status.
-   Subscription status.
-   Filters and summary views.

The dashboard should help the finance lead answer common business
questions without manually preparing spreadsheets.

## 5. Technology Stack

The following is our **proposed implementation stack**. It is a
technical recommendation for building the solution; the challenge
document does not mandate specific programming languages or frameworks.

  -----------------------------------------------------------------------
  Layer                   Technology              Why we use it
  ----------------------- ----------------------- -----------------------
  Frontend                React.js                Build interactive
                                                  admin, staff, and
                                                  customer screens

  UI styling              Tailwind CSS            Create a responsive and
                                                  consistent interface

  Backend                 Python FastAPI          Build REST APIs and
                                                  business logic

  Database                PostgreSQL              Store structured
                                                  business and billing
                                                  records reliably

  ORM                     SQLAlchemy              Work with database
                                                  records using Python

  Database migrations     Alembic                 Manage database schema
                                                  changes

  Authentication          JWT with secure         Authenticate users and
                          password hashing        protect APIs

  Background jobs         Celery                  Run billing and
                                                  notification tasks
                                                  outside normal requests

  Job broker / cache      Redis                   Queue background tasks
                                                  and support caching

  Payments                Razorpay test mode or   Demonstrate online
                          another supported       payment integration
                          gateway                 

  Email                   SMTP or an email        Send password-reset and
                          service                 subscription
                                                  notifications

  Charts                  Recharts                Display revenue and
                                                  subscription analytics

  Testing                 Pytest                  Test APIs and business
                                                  rules

  API documentation       FastAPI OpenAPI /       Inspect and test API
                          Swagger UI              endpoints

  Deployment              Docker                  Package services
                                                  consistently
  -----------------------------------------------------------------------

### Why this stack?

-   **React** provides a responsive user interface.
-   **FastAPI** is suitable for Python-based APIs and provides
    interactive API documentation.
-   **PostgreSQL** supports structured relationships between customers,
    subscriptions, invoices, and payments.
-   **Celery and Redis** allow scheduled and background work, such as
    recurring billing and reminders.
-   **Razorpay test mode** can demonstrate a payment flow without
    collecting real money.
-   **Docker** helps run the application consistently across development
    and deployment environments.

For a short hackathon, build the core application first. Add
Redis/Celery and external integrations after the main subscription and
invoice flow works.

## 6. High-Level Architecture

``` text
                  USERS
       Admin | Staff | Customer
                    |
                    v
          React.js + Tailwind CSS
                    |
               REST API
                    |
                    v
              Python FastAPI
          /         |          \
         /          |           \
        v           v            v
  PostgreSQL    Redis Queue    Payment Gateway
  Main Data          |
                     v
                Celery Workers
               /      |       \
              v       v        v
          Recurring  Renewal  Email
           Billing   Checks  Notifications
                    |
                    v
             Dashboard / Reports
```

### Simple request flow

1.  The user performs an action in the React application.
2.  React sends an HTTP request to a FastAPI endpoint.
3.  FastAPI checks authentication, permissions, and input.
4.  The backend applies the business rules.
5.  PostgreSQL stores or retrieves the required records.
6.  Background jobs handle scheduled work such as due invoices and
    reminders.
7.  The frontend displays the latest status and dashboard information.

## 7. Suggested Database Design

The following are proposed core tables. Exact columns and constraints
should be finalized during implementation.

  -----------------------------------------------------------------------
  Table                               Purpose
  ----------------------------------- -----------------------------------
  `users`                             Login details, email, password
                                      hash, and role

  `products`                          Product name, type, sales price,
                                      cost price, and notes

  `product_variants`                  Variant details and additional
                                      price

  `plans`                             Price, billing frequency, quantity,
                                      and availability rules

  `quotations`                        Quotation number, customer,
                                      validity, and status

  `quotation_items`                   Products, plans, quantities, and
                                      prices in a quotation

  `subscriptions`                     Customer, plan, dates, payment
                                      terms, and status

  `subscription_items`                Product lines and quantities
                                      belonging to a subscription

  `tax_rules`                         Tax configuration

  `invoices`                          Invoice number, customer, dates,
                                      totals, and status

  `invoice_items`                     Product lines, quantities, taxes,
                                      and line totals

  `discounts`                         Discount type, value, dates,
                                      conditions, and usage limit

  `discount_usages`                   Records of discount applications
                                      and usage

  `payments`                          Amount, method, date, invoice, and
                                      payment status

  `billing_records`                   Tracks processed billing periods to
                                      prevent duplicate invoices

  `notifications`                     Notification type, recipient,
                                      status, and timestamp
  -----------------------------------------------------------------------

### Important relationships

-   One customer can have many subscriptions.
-   One plan can be used by many subscriptions.
-   One subscription can generate multiple invoices over time.
-   One invoice can contain multiple invoice items.
-   Payments are recorded against invoices.
-   Products can have multiple variants.
-   Discounts can apply to eligible products or subscriptions.

Use foreign keys and database constraints to protect relationships and
prevent invalid records.

## 8. Important Business Rules

These rules are essential for a reliable billing application:

1.  A user's email must be unique.
2.  Only Admin can create staff accounts and discount rules.
3.  Customers must not access another customer's records.
4.  A subscription must use a valid plan and valid dates.
5.  Billing should happen only when a subscription is due and eligible
    for billing.
6.  A billing period must not generate duplicate invoices.
7.  Tax and discount calculations must follow configured rules.
8.  A discount must not be used after its expiry or usage limit.
9.  A payment must be associated with the correct invoice.
10. Invoice and subscription status changes must follow valid
    transitions.
11. Financial calculations should use precise decimal values rather than
    floating-point arithmetic.
12. Payment gateway callbacks must be verified before marking an invoice
    as paid.

## 9. Innovation and Novelty

The core features above solve the requirements in the challenge. The
following are **proposed enhancements** that can make the implementation
more useful and distinctive. They should be described as innovations
only after they are actually implemented and demonstrated.

### 9.1 Smart Subscription Health Monitor

Show a simple health indicator for each subscription:

-   Healthy: active and payments are up to date.
-   Attention needed: renewal is approaching.
-   At risk: invoice is overdue or payment has failed.

**Value:** Staff can identify subscriptions that need attention instead
of checking every record manually.

### 9.2 Intelligent Renewal Reminder System

Send reminders based on subscription expiry and payment status.

Example:

-   First reminder: seven days before expiry.
-   Second reminder: three days before expiry.
-   Final reminder: on the expiry date.

The reminder schedule should be configurable by the Admin.

**Value:** Reduces the chance of missed renewals and improves customer
communication.

### 9.3 Billing Safety and Duplicate Prevention

Use a unique billing-period reference for each subscription and billing
cycle. Before creating an invoice, check whether that billing period has
already been processed. Use database transactions and appropriate unique
constraints.

**Value:** Helps prevent duplicate invoices when a scheduled job runs
more than once or is retried after a failure.

### 9.4 Revenue Insights

Show useful business indicators:

-   Monthly recurring revenue (MRR).
-   Yearly recurring revenue (ARR), where applicable.
-   Total payments received.
-   Outstanding invoices.
-   Overdue amounts.
-   Subscription growth and cancellations.

Clearly define how each metric is calculated. For example, distinguish
revenue received from the value of active recurring subscriptions.

**Value:** Helps management understand business performance.

### 9.5 Customer Self-Service Portal

Allow customers to view their plans, subscription dates, invoices, and
payment history without contacting staff.

**Value:** Reduces support work and gives customers more control.

### 9.6 Subscription Risk Prediction --- Future Enhancement

In a later version, a machine-learning model could estimate the
likelihood of a subscription not being renewed using historical payment
and renewal data.

**Value:** Helps the business prioritize customer follow-up.

This feature requires suitable historical data and evaluation. It is not
part of the basic system unless developed and tested.

## 10. Performance, Reliability, and Security

The challenge specifically expects pages to respond in under two
seconds, even with thousands of subscriptions.

Our proposed approach:

-   Add database indexes to frequently filtered fields such as customer
    ID, subscription status, due date, and invoice status.
-   Use pagination instead of loading thousands of records at once.
-   Select only the fields needed by each screen.
-   Avoid repeated database queries and use efficient joins.
-   Cache suitable dashboard summaries when appropriate.
-   Run billing and email work in background jobs.
-   Use database transactions for invoice creation and payment updates.
-   Add logging and error handling for failed background jobs.
-   Test important pages with realistic data volumes.

Security practices:

-   Hash passwords securely; never store plain-text passwords.
-   Validate all incoming data.
-   Enforce role-based permissions on the backend, not only in the
    frontend.
-   Use HTTPS in production.
-   Keep API keys and secrets in environment variables.
-   Verify payment gateway signatures or webhooks.
-   Record important financial and administrative actions in an audit
    log.

The two-second target must be measured through testing. It should not be
claimed as achieved until performance tests confirm it.

## 11. Future Scope

Possible improvements for future versions include:

1.  **More payment gateways:** Support additional local and
    international payment providers.
2.  **Multi-currency billing:** Allow companies to sell subscriptions in
    different currencies.
3.  **Multi-language portal:** Support customers who prefer different
    languages.
4.  **Advanced tax support:** Add configurable tax rules for different
    regions.
5.  **AI-powered revenue forecasting:** Estimate future recurring
    revenue using historical data.
6.  **Churn prediction:** Identify subscriptions that may not renew.
7.  **Automated customer support:** Add a chatbot that answers questions
    about plans, invoices, and payment status using authorized customer
    data.
8.  **Mobile application:** Let customers and staff manage subscriptions
    from mobile devices.
9.  **Accounting integration:** Export or synchronize invoice and
    payment records with accounting software.
10. **Audit and compliance reports:** Provide detailed logs of changes
    to plans, discounts, invoices, and payments.

## 12. Testing Strategy

We should test both normal and failure cases.

  -----------------------------------------------------------------------
  Area                                Example test
  ----------------------------------- -----------------------------------
  Registration                        Reject duplicate email addresses

  Password validation                 Reject passwords that do not meet
                                      the required rules

  Roles                               Customer cannot access Admin APIs

  Product pricing                     Variant price is added correctly

  Plans                               Reject invalid billing frequency or
                                      dates

  Subscriptions                       Verify status transitions

  Billing                             Generate an invoice for a due
                                      subscription

  Duplicate prevention                Running the same billing job twice
                                      must not create two invoices for
                                      one period

  Discounts                           Reject expired or exhausted
                                      discounts

  Payments                            Do not mark an invoice paid without
                                      a verified payment

  Reports                             Verify dashboard totals against
                                      stored records

  Performance                         Test key pages with thousands of
                                      subscriptions
  -----------------------------------------------------------------------

## 13. Suggested API Endpoints

These are proposed REST API routes for implementation.

  ----------------------------------------------------------------------------------
  Method                  Endpoint                           Purpose
  ----------------------- ---------------------------------- -----------------------
  POST                    `/api/auth/register`               Register a customer

  POST                    `/api/auth/login`                  Sign in

  POST                    `/api/auth/forgot-password`        Request password reset

  POST                    `/api/admin/staff`                 Create a staff account

  GET / POST              `/api/products`                    List or create products

  GET / POST              `/api/plans`                       List or create plans

  GET / POST              `/api/quotations`                  List or create
                                                             quotations

  GET / POST              `/api/subscriptions`               List or create
                                                             subscriptions

  PATCH                   `/api/subscriptions/{id}/status`   Update subscription
                                                             status

  GET / POST              `/api/invoices`                    List or create invoices

  POST                    `/api/billing/run`                 Trigger an authorized
                                                             billing run

  GET / POST              `/api/discounts`                   List or create discount
                                                             rules

  GET / POST              `/api/payments`                    List or record payments

  GET                     `/api/dashboard/summary`           Retrieve dashboard
                                                             summary

  GET                     `/api/reports/revenue`             Retrieve revenue report
  ----------------------------------------------------------------------------------

Protect these routes with authentication and role-based authorization. A
production billing scheduler should run automatically; the manual
billing endpoint should be restricted to authorized administrators or
internal services.

## 14. Suggested Project Folder Structure

``` text
subscription-management-system/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── workers/
│   │   ├── database/
│   │   └── main.py
│   ├── tests/
│   ├── alembic/
│   └── requirements.txt
│
├── docs/
│   ├── architecture.md
│   └── database-design.md
│
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

## 15. Suggested Development Plan

A practical implementation order for a small team:

  -----------------------------------------------------------------------
  Phase                               Work
  ----------------------------------- -----------------------------------
  1                                   Finalize database design and
                                      project setup

  2                                   Build registration, login, and role
                                      permissions

  3                                   Build product, variant, and plan
                                      management

  4                                   Build quotation and subscription
                                      lifecycle

  5                                   Implement invoice generation, tax,
                                      and duplicate prevention

  6                                   Implement discounts and payment
                                      tracking

  7                                   Build dashboard, filters, and
                                      reports

  8                                   Add scheduled jobs, reminders, and
                                      payment gateway test integration

  9                                   Test security, business rules, and
                                      performance

  10                                  Deploy and prepare a complete
                                      demonstration
  -----------------------------------------------------------------------

For a short event, prioritize a working end-to-end flow before optional
AI features or complex integrations.

## 16. Hackathon Demonstration Plan

A clear demonstration can follow one customer from registration to
payment:

1.  Sign in as Admin.
2.  Create a product and a monthly plan.
3.  Create a customer account.
4.  Create a quotation and confirm the subscription.
5.  Show the subscription becoming active.
6.  Trigger or simulate its billing date in a controlled demo
    environment.
7.  Show the automatically generated invoice.
8.  Apply an eligible discount and show the calculation.
9.  Record a test payment and show the invoice becoming paid.
10. Open the dashboard and show active subscriptions, received revenue,
    and outstanding invoices.
11. Demonstrate that a customer can view only their own subscription and
    invoices.
12. Run the billing process again and show that it does not create a
    duplicate invoice.

Use test data and a payment gateway's test mode for the demonstration.

## 17. Expected Benefits

  -----------------------------------------------------------------------
  User                                Benefit
  ----------------------------------- -----------------------------------
  Admin                               Central control over products,
                                      plans, taxes, discounts, and staff

  Staff                               Less manual tracking and easier
                                      daily operations

  Customer                            Self-service access to
                                      subscriptions and invoices

  Finance team                        Faster visibility into revenue,
                                      payments, and overdue invoices

  Business                            Fewer manual errors and a more
                                      organized subscription process
  -----------------------------------------------------------------------

## 18. Conclusion

The Subscription Management System is designed to become the central
platform for a subscription-based business. It brings customer
management, product and plan setup, subscription tracking, recurring
invoice generation, discount rules, payment records, and revenue
reporting into one application.

By automating repetitive billing activities, enforcing clear business
rules, and giving each user the right level of access, the platform aims
to make subscription operations more accurate, transparent, and
scalable.

**Our vision:** Make subscription management simple for customers,
efficient for employees, and transparent for business owners.

------------------------------------------------------------------------

## Project Status

This README describes the proposed solution and implementation plan.
Update this section as development progresses.

-   [ ] Authentication and role-based access
-   [ ] Product and plan management
-   [ ] Quotation and subscription lifecycle
-   [ ] Recurring invoice generation
-   [ ] Tax and discount rules
-   [ ] Payment tracking and gateway integration
-   [ ] Customer self-service portal
-   [ ] Dashboard and revenue reports
-   [ ] Scheduled reminders and billing jobs
-   [ ] Security and performance testing
-   [ ] Deployment

## License

Choose and add an appropriate open-source license before publishing this
project publicly.
