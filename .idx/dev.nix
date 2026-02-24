{ pkgs, ... }: {
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_18 # Asegúrate de que Node.js esté incluido para usar npx
  ];
  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = [
          "npx"
          "serve"
          "." # Serving from the root directory
          "-l"
          "tcp://0.0.0.0:$PORT"
        ];
        manager = "web";
      };
    };
  };
}
