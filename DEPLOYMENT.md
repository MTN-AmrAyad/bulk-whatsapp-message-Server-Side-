# Deployment Guide

This guide provides instructions for deploying the `wa-test` project.

## Prerequisites

Ensure you have the following installed on your deployment environment:

- Node.js (version 14.x or higher)
- npm or pnpm
- TypeScript
- A database (e.g., PostgreSQL)

## Environment Variables

Create a `.env.production` file in the root directory of your project with the following variables:

```env
PORT=3000
DB_HOST=your_database_host
DB_PORT=your_database_port
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret
```

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd bulk_whatsapp_messages
```

2. Install the dependencies:

```bash
pnpm install
```

## Build

Compile the TypeScript code to JavaScript:

```bash
pnpm build
```

## Database Setup

Create a new database in your MySQL server with the name specified in the `DB_NAME` environment variable.

## Start the Server

Start the server:

```bash
pnpm start
```

The server will start on the port specified in the `PORT` environment variable.

## Additional Information

- Ensure the database connection details are correct in the `.env.production` file.
- The server will automatically create the necessary tables in the database on startup.
- Ensure that the `uploads` directory is writable by the server.
- The server will automatically send messages at the scheduled time.
