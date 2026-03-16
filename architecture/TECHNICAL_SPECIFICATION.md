# E-Commerce Technical Architecture

This document defines the technical standards, architectural patterns, and required skills for the development of the HRMS E-Commerce platform.

## 1. Technical Stack
- **Frontend**: React 18.2.0, Tailwind CSS 3.x, shadcn/ui.
- **State**: Zustand (Global), TanStack Query (Server Cache).
- **Authentication**: Clerk (Production Auth, OIDC/JWT).
- **Email**: Brevo (SMTP/API for order transactional emails).
- **Backend**: Laravel 8.x/9.x, PHP 8.1+, MySQL 8.0.
- **Environment**: Node.js v24.13.1.

## 2. Component Architecture
Follow the **Atomic Design** philosophy in `resources/js/components/`:
- `ui/`: shadcn/ui base atoms.
- `shared/`: Reusable project-specific molecules/organisms.
- `features/`: Module-specific components (cart, products, checkout).

## 3. Backend Patterns
- **Service Layer**: Business logic lives in `app/Services/`.
- **API Resources**: Data transformation in `app/Http/Resources/`.
- **Real-time**: Laravel Echo for order updates.

## 4. Development Standards
- **Optimistic UI**: Immediate feedback for user actions.
- **Transactional Integrity**: `DB::transaction()` for all checkout processes.
- **Validation**: Zod (FE) and FormRequests (BE).
