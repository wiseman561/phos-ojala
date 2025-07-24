########################################
# Multistage, self-contained build      #
########################################

# ---------- build ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy Directory.Packages.props first
COPY ["Directory.*.props", "./"]

# Copy project files first for better layer caching
COPY ["src/backend/Ojala.Identity/Ojala.Identity.csproj", "src/backend/Ojala.Identity/"]
COPY ["src/backend/Ojala.Data/Ojala.Data.csproj", "src/backend/Ojala.Data/"]
COPY ["src/shared/Ojala.Common/Ojala.Common.csproj", "src/shared/Ojala.Common/"]
COPY ["src/shared/Ojala.Contracts/Ojala.Contracts.csproj", "src/shared/Ojala.Contracts/"]

# Restore packages
RUN dotnet restore "src/backend/Ojala.Identity/Ojala.Identity.csproj"

# Copy everything else
COPY ["src/backend/Ojala.Identity/", "src/backend/Ojala.Identity/"]
COPY ["src/backend/Ojala.Data/", "src/backend/Ojala.Data/"]
COPY ["src/shared/Ojala.Common/", "src/shared/Ojala.Common/"]
COPY ["src/shared/Ojala.Contracts/", "src/shared/Ojala.Contracts/"]

# Build and publish
RUN dotnet publish src/backend/Ojala.Identity/Ojala.Identity.csproj -c Release -o /app/publish

# ---------- runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/healthz || exit 1
ENTRYPOINT ["dotnet", "Ojala.Identity.dll"]
