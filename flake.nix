{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    unstable.url = "github:NixOS/nixpkgs/nixos-unstable";
    devenv.url = "github:cachix/devenv/v1.3";
  };

  nixConfig = {
    extra-substituters = ["https://devenv.cachix.org"];
    extra-trusted-public-keys = ["devenv.cachix.org-1:w1cLUi8dv3hnoSPGAuibQv+f9TZLr6cv/Hm9XgU50cw="];
  };

  outputs = inputs @ {
    flake-parts,
    nixpkgs,
    unstable,
    ...
  }:
    flake-parts.lib.mkFlake {inherit inputs;} {
      imports = [
        inputs.devenv.flakeModule
      ];
      systems = nixpkgs.lib.systems.flakeExposed;

      perSystem = {
        config,
        self',
        inputs',
        pkgs,
        system,
        ...
      }: {
        packages.default = pkgs.hello;

        devenv.shells.default = {
          packages = [
            config.packages.default
          ];

          languages.javascript = {
            enable = true;
            bun.enable = true;
            bun.package = inputs'.unstable.legacyPackages.bun;
          };
        };
      };
    };
}
