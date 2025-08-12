#!/bin/bash

npm install
npm run build

MAIN_JS_CONTENT=$(cat ./dist/main.js)
PACKAGE_JSON_CONTENT=$(cat ./package.json)

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: kubexm-terminals-plugin-files
  namespace: tcm
  labels:
      headlamp.dev/plugin: "kubexm-terminals"
data:
  main.js: |
$(echo "$MAIN_JS_CONTENT" | sed 's/^/    /')
  package.json: |
$(echo "$PACKAGE_JSON_CONTENT" | sed 's/^/    /')
EOF