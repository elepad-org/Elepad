# ✅ Base: comes with Node 20, npm, non-root "node" user, and devcontainer niceties
FROM mcr.microsoft.com/devcontainers/javascript-node:20

USER root

# ------------------------------------------------------------------------------
# System deps for native modules & Android tooling
# ------------------------------------------------------------------------------
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    openjdk-17-jdk \
    python3-minimal \
    build-essential \
    pkg-config \
    libssl-dev \
    curl \
    unzip \
    git \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# ------------------------------------------------------------------------------
# Android SDK (commandline-tools + platform-tools + build-tools + platform)
# ------------------------------------------------------------------------------
ARG ANDROID_SDK_ROOT=/opt/android-sdk
ARG ANDROID_CLI_VERSION=13114758
ARG ANDROID_PLATFORM=android-35
ARG ANDROID_BUILD_TOOLS=35.0.0
ARG ANDROID_BUILD_TOOLS=34.0.0
ARG ANDROID_CLI_ZIP_URL="https://dl.google.com/android/repository/commandlinetools-linux-${ANDROID_CLI_VERSION}_latest.zip"

ENV ANDROID_HOME=${ANDROID_SDK_ROOT} \
    ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT} \
    JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 \
    GRADLE_USER_HOME=/home/node/.gradle \
    PATH=${PATH}:${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools:${ANDROID_SDK_ROOT}/build-tools/${ANDROID_BUILD_TOOLS}

RUN mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools \
 && curl -fsSL "${ANDROID_CLI_ZIP_URL}" -o /tmp/cmdline-tools.zip \
 && unzip -q /tmp/cmdline-tools.zip -d /tmp/android-cli \
 && mv /tmp/android-cli/cmdline-tools ${ANDROID_SDK_ROOT}/cmdline-tools/latest \
 && rm -rf /tmp/cmdline-tools.zip /tmp/android-cli

# Accept licenses + install only what you need to build Android
RUN yes | sdkmanager --sdk_root="${ANDROID_SDK_ROOT}" --licenses >/dev/null \
 && sdkmanager --sdk_root="${ANDROID_SDK_ROOT}" \
      "platform-tools" \
      "platforms;${ANDROID_PLATFORM}" \
      "build-tools;${ANDROID_BUILD_TOOLS}"

# Permissions for non-root dev user
RUN mkdir -p /home/node/.android ${GRADLE_USER_HOME} \
 && chown -R node:node ${ANDROID_SDK_ROOT} /home/node/.android ${GRADLE_USER_HOME}

# ------------------------------------------------------------------------------
# Workspace
# ------------------------------------------------------------------------------
WORKDIR /workspaces/elepad

# Keep container idle for Dev Containers; your apps run via npm scripts
CMD ["sleep", "infinity"]

# Switch back to the "node" user for dev (safer, matches devcontainers base)
USER node
