########################################
# Multistage, self-contained build     #
########################################

# ---------- build ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. copy solution and props files first
COPY ["Directory.*.props", "./"]
COPY ["Ojala.sln", "./"]

# 2. copy all project files (matching solution file paths)
COPY ["src/backend/Ojala.Api/*.csproj", "src/backend/Ojala.Api/"]
COPY ["src/backend/Ojala.Data/*.csproj", "src/backend/Ojala.Data/"]
COPY ["src/backend/Ojala.Identity/*.csproj", "src/backend/Ojala.Identity/"]
COPY ["src/backend/Ojala.HealthScore/*.csproj", "src/backend/Ojala.HealthScore/"]
COPY ["src/backend/Ojala.ApiGateway/*.csproj", "src/backend/Ojala.ApiGateway/"]
COPY ["src/backend/Ojala.Services/*.csproj", "src/backend/Ojala.Services/"]
COPY ["src/shared/Ojala.Common/*.csproj", "src/shared/Ojala.Common/"]
COPY ["src/shared/Ojala.Contracts/*.csproj", "src/shared/Ojala.Contracts/"]

# 3. restore solution
RUN dotnet restore "Ojala.sln"

# 4. copy the rest of the source code
COPY ["src/backend/Ojala.Api/", "src/backend/Ojala.Api/"]
COPY ["src/backend/Ojala.Data/", "src/backend/Ojala.Data/"]
COPY ["src/backend/Ojala.Identity/", "src/backend/Ojala.Identity/"]
COPY ["src/backend/Ojala.HealthScore/", "src/backend/Ojala.HealthScore/"]
COPY ["src/backend/Ojala.ApiGateway/", "src/backend/Ojala.ApiGateway/"]
COPY ["src/backend/Ojala.Services/", "src/backend/Ojala.Services/"]
COPY ["src/shared/Ojala.Common/", "src/shared/Ojala.Common/"]
COPY ["src/shared/Ojala.Contracts/", "src/shared/Ojala.Contracts/"]

# 5. publish only the API project
RUN dotnet publish src/backend/Ojala.Api/Ojala.Api.csproj \
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
