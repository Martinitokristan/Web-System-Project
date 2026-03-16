---
name: Ecommerce Development
description: Technical standards and workflows for building the HRMS ecommerce platform using React 17, Tailwind CSS, and Laravel.
---

# Skill: Ecommerce Development

This skill defines the technical standards and workflows that must be followed when developing the ecommerce portions of this application.

## Core Directives

1. **Engine**: React 18.2.0 (Concurrent Mode)
2. **Authentication**: **Clerk** (Social Login, JWT Syncing, MFA).
3. **Email Strategy**:
   - **Auth (OTP/Verify)**: Managed entirely via Clerk.
   - **Commerce (Receipts/Stock)**: Managed via **Brevo** (API Key).
4. **Utility-First Styling**: All new UI components MUST use Tailwind CSS utility classes. Do not create new `.scss` or `.css` files.
2. **shadcn/ui Primitives**: Use Radix-based primitives from shadcn/ui for all interactive elements (Modals, Dropdowns, Sheets).
3. **State Management**:
   - Use **Zustand** for client-side global state (Cart, User Preferences).
   - Use **TanStack Query** for server-side state (Product lists, Order history).
4. **Form Handling**: Use `React Hook Form` with `Zod` validation schemas.

## Workflows

### 1. Creating a Component
- Identify the primitive from shadcn/ui.
- Install it: `npx shadcn-ui@latest add [component]`.
- Implement in `resources/js/components/`.

### 2. Modernizing an API Endpoint
- Use a **Service Class** in `app/Services/` for logic.
- Use an **API Resource** in `app/Http/Resources/` for the response.
- Ensure type-safe validation using Laravel FormRequests.

## Reference Architecture
See [Architecture/TECHNICAL_SPECIFICATION.md](../../Architecture/TECHNICAL_SPECIFICATION.md) for the full technical breakdown.
