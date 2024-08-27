# Bulk WhatsApp Messages

This project allows you to send bulk WhatsApp messages using the WPPConnect library.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Build](#build)
- [Database Setup](#database-setup)
- [Start the Server](#start-the-server)
- [Development](#development)
- [Linting and Formatting](#linting-and-formatting)
- [Folder Structure](#folder-structure)
- [License](#license)

## Prerequisites

Ensure you have the following installed on your development environment:

- Node.js (version 14.x or higher)
- npm or pnpm
- TypeScript
- A database (e.g., PostgreSQL)

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

## Environment Variables

Create a `.env.development` file in the root directory of your project with the following variables:

```env
PORT=3000
DB_HOST=your_database_host
DB_PORT=your_database_port
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret
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

## Development

To start the development server with hot reloading, run:

```bash
pnpm dev
```

## Linting and Formatting

To lint and format the code, run:

```bash
pnpm lint
```

## Folder Structure

```plaintext
.env.development
.eslintrc.json
.gitignore
.prettierrc
.vscode/
    settings.json
DEPLOYMENT.md
nodemon.json
package.json
pnpm-lock.yaml
src/
    data-source.ts
    entities/
        MessageLog.ts
        User.ts
    index.ts
    middlewares/
        auth.ts
    routes/
        auth.ts
    utils/
        messaging.ts
tokens/
tsconfig.json
uploads/
```
