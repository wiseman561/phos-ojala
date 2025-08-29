FROM mcr.microsoft.com/dotnet/sdk:8.0

WORKDIR /src
COPY . .

# Install EF tools
RUN dotnet tool install --global dotnet-ef

# Set PATH to include dotnet tools
ENV PATH="$PATH:/root/.dotnet/tools"

# Create a script to run migrations
RUN echo '#!/bin/bash\necho "Running database migrations..."\ndotnet ef database update --project src/backend/Phos.Data --startup-project src/backend/Phos.Data -c PhosDbContext\necho "Migrations completed!"' > /run-migrations.sh
RUN chmod +x /run-migrations.sh

ENTRYPOINT ["/run-migrations.sh"]
