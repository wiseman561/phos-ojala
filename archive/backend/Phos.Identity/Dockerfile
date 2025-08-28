########################################
# Multistage, self-contained build      #
########################################

# ---------- build ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy Directory.Packages.props first
COPY ["Directory.*.props", "./"]

# Copy project files first for better layer caching
COPY ["src/backend/Phos.Identity/Phos.Identity.csproj", "src/backend/Phos.Identity/"]
COPY ["src/backend/Phos.Data/Phos.Data.csproj", "src/backend/Phos.Data/"]
COPY ["src/shared/Phos.Common/Phos.Common.csproj", "src/shared/Phos.Common/"]
COPY ["src/shared/Phos.Contracts/Phos.Contracts.csproj", "src/shared/Phos.Contracts/"]

# Restore packages
RUN dotnet restore "src/backend/Phos.Identity/Phos.Identity.csproj"

# Copy everything else
COPY ["src/backend/Phos.Identity/", "src/backend/Phos.Identity/"]
COPY ["src/backend/Phos.Data/", "src/backend/Phos.Data/"]
COPY ["src/shared/Phos.Common/", "src/shared/Phos.Common/"]
COPY ["src/shared/Phos.Contracts/", "src/shared/Phos.Contracts/"]

# Build and publish
RUN dotnet publish src/backend/Phos.Identity/Phos.Identity.csproj -c Release -o /app/publish

# ---------- runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/healthz || exit 1
ENTRYPOINT ["dotnet", "Phos.Identity.dll"]
