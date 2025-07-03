########################################
# Multistage, self-contained build      #
########################################

# ---------- build ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files first for better layer caching
COPY ["src/backend/Ojala.Identity/Ojala.Identity.csproj", "Ojala.Identity/"]
COPY ["src/backend/Ojala.Data/Ojala.Data.csproj", "Ojala.Data/"]
COPY ["src/shared/Ojala.Common/Ojala.Common.csproj", "shared/Ojala.Common/"]
COPY ["src/shared/Ojala.Contracts/Ojala.Contracts.csproj", "shared/Ojala.Contracts/"]

# Restore packages
WORKDIR /src/Ojala.Identity
RUN dotnet restore

# Copy everything else
WORKDIR /src
COPY ["src/backend/Ojala.Identity/", "Ojala.Identity/"]
COPY ["src/backend/Ojala.Data/", "Ojala.Data/"]
COPY ["src/shared/Ojala.Common/", "shared/Ojala.Common/"]
COPY ["src/shared/Ojala.Contracts/", "shared/Ojala.Contracts/"]

# Build and publish
WORKDIR /src/Ojala.Identity
RUN dotnet publish -c Release -o /app/publish

# ---------- runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/healthz || exit 1
ENTRYPOINT ["dotnet", "Ojala.Identity.dll"]
