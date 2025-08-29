exit_after_auth = false
pid_file = "/vault/agent/pidfile"

auto_auth {
  method "token" {
    mount_path = "auth/token"
    config = {
      token = "phos-root-token"
    }
  }

  sink "file" {
    config = {
      path = "/vault/secrets/token"
    }
  }
}

template {
  source      = "/vault/config/secrets.tmpl"
  destination = "/vault/secrets/appsettings.json"
}

vault {
  address = "http://vault:8200"
}
