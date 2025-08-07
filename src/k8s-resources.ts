export const terminalNamespace = {
    apiVersion: 'v1',
    kind: 'Namespace',
    metadata: { name: 'kubexm-terminals' },
};

export const terminalServiceAccount = {
    apiVersion: 'v1',
    kind: 'ServiceAccount',
    metadata: {
        name: 'ops-ui-admin-sa',
        namespace: 'kubexm-terminals',
    },
};

export const terminalClusterRoleBinding = {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'ClusterRoleBinding',
    metadata: { name: 'ops-ui-admin-binding' },
    subjects: [
        {
            kind: 'ServiceAccount',
            name: 'ops-ui-admin-sa',
            namespace: 'kubexm-terminals',
        },
    ],
    roleRef: {
        kind: 'ClusterRole',
        name: 'cluster-admin',
        apiGroup: 'rbac.authorization.k8s.io',
    },
};

export function getTerminalDaemonSet(image: string) {
    return {
        apiVersion: 'apps/v1',
        kind: 'DaemonSet',
        metadata: {
            name: 'node-shell-ds',
            namespace: 'kubexm-terminals',
            labels: { app: 'node-shell' },
        },
        spec: {
            selector: { matchLabels: { app: 'node-shell' } },
            template: {
                metadata: { labels: { app: 'node-shell' } },
                spec: {
                    serviceAccountName: 'ops-ui-admin-sa',
                    tolerations: [{ operator: 'Exists' }],
                    hostNetwork: true,
                    hostPID: true,
                    volumes: [{ name: 'host-root', hostPath: { path: '/' } }],
                    containers: [{
                        name: 'node-shell-container',
                        image: image,
                        command: ["/bin/sh", "-c"],
                        args: ["exec /usr/bin/ttyd --writable -p 7681 /usr/bin/nsenter --target 1 --mount --uts --ipc --net --pid /bin/bash"],
                        ports: [{ name: 'node-shell', containerPort: 7681, hostPort: 7681 }],
                        volumeMounts: [{ name: 'host-root', mountPath: '/host' }],
                        securityContext: { privileged: true },
                    }],
                },
            },
        },
    };
}

export function getTerminalDeployment(image: string) {
    return {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
            name: 'kubectl-shell-deployment',
            namespace: 'kubexm-terminals',
            labels: { app: 'kubectl-shell' },
        },
        spec: {
            replicas: 1,
            selector: { matchLabels: { app: 'kubectl-shell' } },
            template: {
                metadata: { labels: { app: 'kubectl-shell' } },
                spec: {
                    serviceAccountName: 'ops-ui-admin-sa',
                    hostname: 'kubectl-shell',
                    tolerations: [
                        { key: 'node-role.kubernetes.io/master', effect: 'NoSchedule' },
                        { key: 'node-role.kubernetes.io/control-plane', effect: 'NoSchedule' }
                    ],
                    containers: [{
                        name: 'kubectl-shell-container',
                        image: image,
                        command: ["/usr/bin/ttyd"],
                        args: ["--writable", "-p", "7682", "/bin/bash"],
                        ports: [{ name: 'kubectl-shell', containerPort: 7682 }],
                    }],
                },
            },
        },
    };
}

export const terminalService = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
        name: 'kubectl-shell-svc',
        namespace: 'kubexm-terminals',
    },
    spec: {
        type: 'NodePort',
        selector: { app: 'kubectl-shell' },
        ports: [{
            protocol: 'TCP',
            port: 80,
            targetPort: 7682,
            nodePort: 30082,
        }],
    },
};