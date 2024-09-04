# Stage 1: Build the application
FROM node:20 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY . /app
WORKDIR /app

# Copy the rest of the application files and build the app

COPY . .

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist

# Define build argument and set environment variable from build argument
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

# Expose the port your app runs on
EXPOSE 30530

# Serve the app with cross-env and pnpm start
CMD ["sh", "-c", "export NODE_ENV=$NODE_ENV && pnpm start"]

