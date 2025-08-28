########################################
# Multistage, self-contained build     #
########################################

# ---------- build ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. copy solution and props files first
COPY ["Directory.*.props", "./"]
COPY ["Phos.sln", "./"]

# 2. copy all project files (matching solution file paths)
COPY ["src/backend/Phos.Api/*.csproj", "src/backend/Phos.Api/"]
COPY ["src/backend/Phos.Data/*.csproj", "src/backend/Phos.Data/"]
COPY ["src/backend/Phos.Identity/*.csproj", "src/backend/Phos.Identity/"]
COPY ["src/backend/Phos.HealthScore/*.csproj", "src/backend/Phos.HealthScore/"]
COPY ["src/backend/Phos.ApiGateway/*.csproj", "src/backend/Phos.ApiGateway/"]
COPY ["src/backend/Phos.Services/*.csproj", "src/backend/Phos.Services/"]
COPY ["src/shared/Phos.Common/*.csproj", "src/shared/Phos.Common/"]
COPY ["src/shared/Phos.Contracts/*.csproj", "src/shared/Phos.Contracts/"]

# 3. restore solution
RUN dotnet restore "Phos.sln"

# 4. copy the rest of the source code
COPY ["src/backend/Phos.Api/", "src/backend/Phos.Api/"]
COPY ["src/backend/Phos.Data/", "src/backend/Phos.Data/"]
COPY ["src/backend/Phos.Identity/", "src/backend/Phos.Identity/"]
COPY ["src/backend/Phos.HealthScore/", "src/backend/Phos.HealthScore/"]
COPY ["src/backend/Phos.ApiGateway/", "src/backend/Phos.ApiGateway/"]
COPY ["src/backend/Phos.Services/", "src/backend/Phos.Services/"]
COPY ["src/shared/Phos.Common/", "src/shared/Phos.Common/"]
COPY ["src/shared/Phos.Contracts/", "src/shared/Phos.Contracts/"]

# 5. publish only the API project
RUN dotnet publish src/backend/Phos.Api/Phos.Api.csproj \
    -c Release -o /app/publish

# ---------- runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/healthz || exit 1
ENTRYPOINT ["dotnet","Phos.Api.dll"]
