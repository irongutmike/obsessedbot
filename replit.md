# Discord Activity Monitoring System

## Overview

A full-stack web application that monitors Discord server activity across multiple servers using both official bots and selfbots. The system provides real-time activity comparisons, historical data visualization, and administrative controls through a modern dashboard interface. Built with React frontend, Express.js backend, and PostgreSQL database, it tracks messages per minute, active users, and provides comprehensive logging and monitoring capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development
- **UI Library**: Radix UI with Tailwind CSS for accessible, customizable components
- **Styling**: Tailwind CSS with custom Discord-themed color variables
- **State Management**: TanStack Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with hot module replacement and development optimizations

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints for server and activity data management
- **Development Server**: Integrated Vite middleware for seamless full-stack development
- **Error Handling**: Centralized error middleware with proper HTTP status codes

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon Database serverless PostgreSQL instance
- **Schema Management**: Drizzle Kit for migrations and schema versioning
- **Fallback Storage**: In-memory storage implementation for development/testing

### Database Schema Design
- **Servers Table**: Stores Discord server metadata and member counts
- **Activity Data Table**: Time-series data for messages per minute and active users
- **Command Logs Table**: Audit trail for bot command executions
- **System Logs Table**: Application events and monitoring data
- **Bot Status Table**: Real-time status tracking for monitoring bots
- **Users Table**: Authentication and user management (prepared but not fully implemented)

### Discord Integration Architecture
- **Official Bot**: Discord.js v14 bot for legitimate server interactions and slash commands
- **Selfbot Monitor**: Automated monitoring client for activity tracking
- **Dual Bot Strategy**: Separates official commands from monitoring to comply with Discord ToS
- **Activity Tracking**: Real-time message buffering and user activity aggregation
- **Scheduled Tasks**: Cron-based periodic data collection and reporting

### Authentication & Authorization
- **Session Management**: Express sessions with PostgreSQL store (connect-pg-simple)
- **User System**: Prepared infrastructure with password-based authentication
- **Bot Authentication**: Discord bot tokens managed through environment variables

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database queries and schema management
- **Drizzle Kit**: Database migration and schema generation tools

### Discord APIs
- **Discord.js**: Official Discord API wrapper for bot functionality
- **Discord Gateway**: Real-time event streaming for message monitoring
- **Discord REST API**: HTTP endpoints for server data and bot commands

### Frontend Libraries
- **Radix UI**: Headless accessible UI component primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **TanStack Query**: Server state management with caching and synchronization
- **Chart.js**: Data visualization library for activity charts and graphs
- **Wouter**: Lightweight routing library for single-page application navigation

### Development Tools
- **Vite**: Fast build tool with hot module replacement and TypeScript support
- **TypeScript**: Static type checking across frontend, backend, and shared code
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Integration**: Development environment optimizations and error overlays

### Utility Libraries
- **date-fns**: Date manipulation and formatting utilities
- **clsx**: Conditional CSS class name utility
- **zod**: Runtime type validation for API schemas and form validation
- **dotenv**: Environment variable management
- **node-cron**: Scheduled task execution for periodic data collection