# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN --mount=type=cache,target=/root/.nuget/packages \
    dotnet restore src/backend/Phos.ApiGateway/Phos.ApiGateway.csproj
RUN dotnet publish src/backend/Phos.ApiGateway/Phos.ApiGateway.csproj \
      -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet","Phos.ApiGateway.dll"]
