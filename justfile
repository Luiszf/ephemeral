build:
    podman build --tag ephemeral .

run: build
    podman run --network host -d -v ./servers:/App/servers ephemeral:latest

deploy: 
    podman kill -a
    git pull
    just run

