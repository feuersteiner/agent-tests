# Docker base images are pinned

Every base image a Dockerfile pulls names a version tag other than `latest`, or a digest. Builds must not change because an image moved.
