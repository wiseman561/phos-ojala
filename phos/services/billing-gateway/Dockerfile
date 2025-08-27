FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . ./
RUN dotnet restore BillingGateway.csproj \
 && dotnet publish -c Release -o /out BillingGateway.csproj

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
RUN adduser --disabled-password --gecos "" appuser \
 && chown -R appuser /app
COPY --from=build /out .
USER appuser
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
HEALTHCHECK --interval=30s --timeout=2s CMD wget -qO- http://localhost:8080/healthz || exit 1
ENTRYPOINT ["dotnet", "Phos.BillingGateway.dll"]


