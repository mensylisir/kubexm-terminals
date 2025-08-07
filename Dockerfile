FROM nicolaka/netshoot:latest

USER root

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

RUN apk update && apk --timeout 600 add --no-cache \
    ttyd \
    kubectl \
    bash \
    coreutils \
    vim \
    nano \
    less \
    htop \
    procps \
    bind-tools \
    curl \
    wget \
    openssl \
    git \
    go \
    python3 \
    py3-pip \
    jq \
    yq \
    && \
    rm -rf /var/cache/apk/*

RUN echo "alias k='kubectl'" >> /etc/bash/bashrc && \
    echo "alias ll='ls -alF'" >> /etc/bash/bashrc && \
    echo "alias la='ls -A'" >> /etc/bash/bashrc && \
    echo "alias l='ls -CF'" >> /etc/bash/bashrc