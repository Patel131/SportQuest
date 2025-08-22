# Overview

SportIQ is a sports quiz application built with React, Express, and PostgreSQL. The app allows users to take interactive quizzes across different sports categories (Football, Basketball, Soccer, Baseball), earn points, track achievements, and compete on a leaderboard. The application features a modern UI with real-time feedback, timed quizzes, and comprehensive user progress tracking.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation resolvers

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Validation**: Zod schemas for request/response validation
- **Storage Interface**: Abstract storage layer with in-memory implementation for development

## Data Storage Solutions
- **Database**: PostgreSQL configured via Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon Database serverless PostgreSQL
- **Development Storage**: In-memory storage implementation with mock data

## Database Schema Design
- **Users**: ID, username, total points, creation timestamp
- **Quizzes**: User sessions with category, score, completion status, time tracking
- **Questions**: Category-based questions with multiple choice options, correct answers, points, and explanations
- **User Answers**: Individual question responses with correctness and timing data
- **Achievements**: User accomplishment tracking system

## Authentication and Authorization
- Currently using demo user system for development
- Session-based authentication infrastructure prepared with connect-pg-simple
- User identification through session management

## API Structure
- **User Management**: User creation, retrieval, leaderboard endpoints
- **Quiz Operations**: Quiz creation, question fetching, completion tracking
- **Question System**: Category-based question retrieval with random selection
- **Answer Tracking**: Individual answer recording and quiz scoring
- **Achievement System**: User achievement management and tracking

# External Dependencies

## Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection driver
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: Database schema management and migrations
- **express**: Web application framework for Node.js
- **vite**: Frontend build tool and development server

## UI and Styling
- **@radix-ui/***: Comprehensive set of UI primitives for accessible components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx**: Conditional className utility
- **lucide-react**: Icon library

## Data Management
- **@tanstack/react-query**: Server state management and caching
- **@hookform/resolvers**: Form validation integration
- **react-hook-form**: Performant form library
- **zod**: TypeScript-first schema validation
- **drizzle-zod**: Integration between Drizzle and Zod

## Development Tools
- **tsx**: TypeScript execution for Node.js
- **esbuild**: JavaScript bundler for production builds
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **@replit/vite-plugin-cartographer**: Replit integration for development environment

## Additional Features
- **date-fns**: Date manipulation utilities
- **nanoid**: Unique ID generation
- **embla-carousel-react**: Carousel component functionality
- **cmdk**: Command palette component
- **connect-pg-simple**: PostgreSQL session store for Express sessions