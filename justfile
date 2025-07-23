# TODO: add support for docker in justfile

build:
    podman build --tag ephemeral .

run: build
    podman run --name ephemeral --network host -d -v ./servers:/App/servers ephemeral:latest

deploy: 
    -podman rm ephemeral
    git pull
    just run

