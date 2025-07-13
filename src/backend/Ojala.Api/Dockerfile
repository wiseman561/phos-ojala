########################################
# Multistage, self-contained build     #
########################################

# ---------- build ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. copy solution and props files first
COPY ["Directory.*.props", "./"]
COPY ["Ojala.sln", "./"]

# 2. copy all project files
COPY ["src/backend/Ojala.Api/*.csproj", "backend/Ojala.Api/"]
COPY ["src/backend/Ojala.Data/*.csproj", "backend/Ojala.Data/"]
COPY ["src/backend/Ojala.Identity/*.csproj", "backend/Ojala.Identity/"]
COPY ["src/backend/Ojala.HealthScore/*.csproj", "backend/Ojala.HealthScore/"]
COPY ["src/backend/Ojala.ApiGateway/*.csproj", "backend/Ojala.ApiGateway/"]
COPY ["src/backend/Ojala.Services/*.csproj", "backend/Ojala.Services/"]
COPY ["src/shared/Ojala.Common/*.csproj", "shared/Ojala.Common/"]
COPY ["src/shared/Ojala.Contracts/*.csproj", "shared/Ojala.Contracts/"]

# 3. restore solution
RUN dotnet restore "Ojala.sln"

# 4. copy the rest of the source code
COPY ["src/backend/Ojala.Api/", "backend/Ojala.Api/"]
COPY ["src/backend/Ojala.Data/", "backend/Ojala.Data/"]
COPY ["src/backend/Ojala.Identity/", "backend/Ojala.Identity/"]
COPY ["src/backend/Ojala.HealthScore/", "backend/Ojala.HealthScore/"]
COPY ["src/backend/Ojala.ApiGateway/", "backend/Ojala.ApiGateway/"]
COPY ["src/backend/Ojala.Services/", "backend/Ojala.Services/"]
COPY ["src/shared/Ojala.Common/", "shared/Ojala.Common/"]
COPY ["src/shared/Ojala.Contracts/", "shared/Ojala.Contracts/"]

# 5. publish only the API project
RUN dotnet publish backend/Ojala.Api/Ojala.Api.csproj \
    -c Release -o /app/publish

# ---------- runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/healthz || exit 1
ENTRYPOINT ["dotnet","Ojala.Api.dll"]
