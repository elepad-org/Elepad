# AI Agents Interaction Guide

This document provides guidelines for AI agents interacting with the `elepad` monorepo.

## Monorepo Overview

This is a monorepo for the `elepad` project, which consists of a mobile application and a backend API. The project uses `npm` as a package manager and `turbo` for managing the monorepo.

### General Commands

- To install all dependencies, run `npm install` at the root of the project.
- To run the development servers for both the `api` and `mobile` apps, use `npm run dev`.
- To build both apps, use `npm run build`.
- To lint the entire project, use `npm run lint`.

### Project Structure

- `apps/api`: Contains the backend API, built with Hono and running on Cloudflare Workers.
- `apps/mobile`: Contains the mobile application, built with React Native and Expo.
- `packages/api-client`: Contains the generated API client for the mobile app to communicate with the API.
- `packages/assets`: Contains static assets used in the applications.
- `supabase`: Contains Supabase migrations and configuration.

## Interacting with the `api` Application

The `api` application is a Hono server running on Cloudflare Workers.

- **Location:** `apps/api`
- **Main technologies:** Hono, TypeScript, Zod, Supabase.
- **Development server:** To run the development server, navigate to `apps/api` and run `npm run dev`.
- **Linting:** To lint the `api` application, navigate to `apps/api` and run `npm run lint`.
- **Building:** To build the `api` application, navigate to `apps/api` and run `npm run build`.

## Interacting with the `mobile` Application

The `mobile` application is a React Native application built with Expo.

- **Location:** `apps/mobile`
- **Main technologies:** React Native, Expo, TypeScript, React Native Paper, TanStack Query.
- **Development server:** To run the development server, navigate to `apps/mobile` and run `npm run dev`. This will start the Expo development server.
- **Linting:** To lint the `mobile` application, navigate to `apps/mobile` and run `npm run lint`.
- **Running on different platforms:**
  - To run on Android, use `npm run android`.
  - To run on iOS, use `npm run ios`.
  - To run on the web, use `npm run web`.

## Interacting with the `api-client`

The `api-client` is a generated client that allows the `mobile` application to communicate with the `api`. It is generated using `orval`. This generated code must not be edited manually.

- **Location:** `packages/api-client`
- **Generation:** The client is generated based on the OpenAPI specification of the `api`. To regenerate the client, you need to have the `api` development server running and then run a command to trigger `orval`. The `orval.config.ts` file is located in the `packages/api-client` directory.
