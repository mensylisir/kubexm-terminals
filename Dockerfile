FROM golang:1.24-alpine AS builder

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

RUN apk update && apk --timeout 600 add --no-cache build-base git
RUN export GOPROXY=https://goproxy.cn,direct && \
    export GOSUMDB=off && \
    go install github.com/mikefarah/yq/v4@latest

FROM nicolaka/netshoot:latest

USER root

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

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
    tshark \
    && \
    rm -rf /var/cache/apk/*

COPY --from=builder /go/bin/yq /usr/bin/yq

RUN echo "alias k='kubectl'" >> /etc/bash/bashrc && \
    echo "alias ll='ls -alF'" >> /etc/bash/bashrc && \
    echo "alias la='ls -A'" >> /etc/bash/bashrc && \
    echo "alias l='ls -CF'" >> /etc/bash/bashrc && \
    echo "export LESS='-F -g -i -M -R -S -w -X -z-4'" >> /etc/bash/bashrc && \
    echo "export EDITOR='vim'" >> /etc/bash/bashrc

CMD ["/bin/bash"]