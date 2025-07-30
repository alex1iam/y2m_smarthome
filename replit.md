# Smart Home Device Configuration Manager

## Overview

This is a full-stack web application for managing smart home device configurations. The system provides a user-friendly interface for creating, editing, and organizing IoT devices with MQTT integration capabilities. It supports device categorization by rooms, various device types, and complex capability configurations for smart home automation systems.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful endpoints with JSON responses
- **Validation**: Zod schemas shared between client and server

### Storage Strategy
- **Primary Storage**: In-memory storage with file-based configuration persistence
- **Configuration Path**: `/opt/yandex2mqtt/config.js` (production server path)
- **Configuration Format**: JavaScript module.exports format for yandex2mqtt compatibility
- **Data Models**: Device configurations with MQTT topics, capabilities, and room organization
- **Server Structure**: Application files in `/opt/yandex2mqtt/smarthome/`, config in `/opt/yandex2mqtt/config.js`
- **Path Configuration**: User can change config file path through Settings modal interface

## Key Components

### Data Models
- **Device Schema**: Comprehensive device definition including ID, name, type, room, MQTT configuration, and capabilities
- **MQTT Instance**: Topic configuration for device communication (set/state topics)
- **Device Capabilities**: Flexible capability system supporting various device types (on/off, range, toggle, color)
- **Configuration**: Complete system configuration including MQTT settings, HTTPS certificates, OAuth clients, and device collections

### Core Features
- **Device Management**: CRUD operations for smart home devices
- **Room Organization**: Automatic room extraction and filtering
- **MQTT Integration**: Topic mapping for device state and control
- **Configuration Export**: Export complete configuration in module.exports format
- **Real-time Updates**: Optimistic updates with React Query
- **Path Configuration**: Settings modal for changing config.js file path with validation
- **Path Testing**: Built-in path validation to ensure file accessibility

### UI Components
- **Device Cards**: Visual device representation with type-specific icons and actions
- **Modal Forms**: Add/edit device forms with complex capability configuration
- **Search and Filter**: Device filtering by name, type, and room
- **Export Interface**: Configuration export with copy/download functionality

## Data Flow

1. **Configuration Loading**: System loads existing configuration from JavaScript files on startup
2. **Device Operations**: Client sends REST API requests for device CRUD operations
3. **State Synchronization**: React Query manages client-server state synchronization
4. **Configuration Persistence**: Changes are reflected in in-memory storage and can be exported
5. **Real-time Updates**: UI updates optimistically while background sync occurs

## External Dependencies

### Core Dependencies
- **Database**: Neon Database for PostgreSQL hosting
- **UI Libraries**: Radix UI primitives for accessible components
- **Validation**: Zod for runtime type checking and validation
- **HTTP Client**: Fetch API for client-server communication
- **Icons**: Lucide React for consistent iconography

### Development Dependencies
- **TypeScript**: Type safety across the entire stack
- **Tailwind CSS**: Utility-first styling approach
- **PostCSS**: CSS processing and optimization
- **ESBuild**: Fast TypeScript compilation for production

## Deployment Strategy

### Build Process
- **Client**: Vite builds React application to static files
- **Server**: ESBuild compiles TypeScript server code to ES modules
- **Assets**: Static assets served from dist/public directory

### Environment Configuration
- **Database**: Requires DATABASE_URL environment variable for PostgreSQL connection
- **Development**: Hot reload with Vite dev server proxy
- **Production**: Express serves both API and static client files

### Hosting Requirements
- **Node.js**: Runtime environment for Express server
- **PostgreSQL**: Database instance (Neon Database recommended)
- **File System**: Access for configuration file reading/writing
- **HTTPS**: Optional SSL certificate configuration for secure communication

The architecture prioritizes developer experience with TypeScript throughout, modern tooling, and a clean separation between client and server concerns while maintaining shared type safety through common schemas.