# Containerized build without installing Node.js locally

# Choose container runtime: docker or podman
CONTAINER ?= docker

# Base node image and local builder image tag
IMAGE_NODE ?= node:18-bullseye
IMAGE_LOCAL ?= refsense-builder:latest

# Named volume to keep node_modules out of your repo directory
NODE_MODULES_VOL ?= refsense_node_modules

.PHONY: build-xpi build-xpi-image docker-image clean-build

# Build using the official Node image (recommended, no local installs)
build-xpi:
	$(CONTAINER) run --rm \
	  -u $(shell id -u):$(shell id -g) \
	  -v "$(PWD)":/workspace \
	  -v $(NODE_MODULES_VOL):/workspace/node_modules \
	  -w /workspace \
	  $(IMAGE_NODE) sh -c "npm ci && npm run build"

# Build a local image (optional)
docker-image:
	$(CONTAINER) build -t $(IMAGE_LOCAL) .

# Build using the local image (still mounts your workspace)
build-xpi-image: docker-image
	$(CONTAINER) run --rm \
	  -u $(shell id -u):$(shell id -g) \
	  -v "$(PWD)":/workspace \
	  -v $(NODE_MODULES_VOL):/workspace/node_modules \
	  -w /workspace \
	  $(IMAGE_LOCAL) sh -c "npm ci && npm run build"

# Clean build artifacts (does not remove the named volume)
clean-build:
	rm -rf build

