import { ApiProxy, K8s } from '@kinvolk/headlamp-plugin/lib';
import {
    Alert, Box, Button, CircularProgress, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, Typography, TablePagination
} from '@mui/material';
import React from 'react';
import {
    getTerminalDaemonSet, getTerminalDeployment, terminalClusterRoleBinding,
    terminalNamespace, terminalService, terminalServiceAccount
} from '../k8s-resources';

type K8sNode = InstanceType<typeof K8s.ResourceClasses.Node>;

const NS = 'kubexm-terminals';
const NODE_SHELL_PORT = 7681;
const KUBECTL_SHELL_NODEPORT = 30082;

function getNodeIP(node: K8sNode): string | null {
    const addresses = node.status?.addresses || [];
    let internalIP: string | null = null;
    let externalIP: string | null = null;

    for (const address of addresses) {
        if (address.type === 'ExternalIP') {
            externalIP = address.address;
        }
        if (address.type === 'InternalIP') {
            internalIP = address.address;
        }
    }
    return externalIP || internalIP;
}

export default function KubexmTerminalsPage() {
    const [areResourcesReady, setAreResourcesReady] = React.useState<boolean | null>(null);
    const [isChecking, setIsChecking] = React.useState(true);
    const [setupError, setSetupError] = React.useState<string | null>(null);
    const [nodes, setNodes] = React.useState<K8sNode[] | null>(null);
    const [isLoadingNodes, setIsLoadingNodes] = React.useState(true);
    const [terminalImage, setTerminalImage] = React.useState('registry.dev.rdev.tech:18093/headlamp/universal-toolkit:1.0');

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const checkResources = React.useCallback(async () => {
        setIsChecking(true);
        setSetupError(null);
        try {
            await ApiProxy.request(`/apis/apps/v1/namespaces/${NS}/deployments/kubectl-shell-deployment`);
            setAreResourcesReady(true);
        } catch (err: any) {
            if (err.status === 404) {
                setAreResourcesReady(false);
            } else {
                setSetupError(`检查资源失败: ${err.message}`);
                setAreResourcesReady(false);
            }
        } finally {
            setIsChecking(false);
        }
    }, []);

    const loadNodes = React.useCallback(() => {
        setIsLoadingNodes(true);
        ApiProxy.request('/api/v1/nodes')
            .then(data => setNodes(data.items || []))
            .catch(err => setSetupError(`加载节点列表失败: ${err.message}`))
            .finally(() => setIsLoadingNodes(false));
    }, []);

    React.useEffect(() => {
        checkResources();
    }, [checkResources]);

    React.useEffect(() => {
        if (areResourcesReady) {
            loadNodes();
        }
    }, [areResourcesReady, loadNodes]);

    const handleInstall = async () => {
        setIsChecking(true);
        setSetupError(null);
        try {
            await ApiProxy.request('/api/v1/namespaces', { method: 'POST', body: JSON.stringify(terminalNamespace), headers: { 'Content-Type': 'application/json' } }).catch(e => { if (e.status !== 409) throw e; });
            await ApiProxy.request(`/api/v1/namespaces/${NS}/serviceaccounts`, { method: 'POST', body: JSON.stringify(terminalServiceAccount), headers: { 'Content-Type': 'application/json' } }).catch(e => { if (e.status !== 409) throw e; });
            await ApiProxy.request('/apis/rbac.authorization.k8s.io/v1/clusterrolebindings', { method: 'POST', body: JSON.stringify(terminalClusterRoleBinding), headers: { 'Content-Type': 'application/json' } }).catch(e => { if (e.status !== 409) throw e; });
            await ApiProxy.request(`/apis/apps/v1/namespaces/${NS}/daemonsets`, { method: 'POST', body: JSON.stringify(getTerminalDaemonSet(terminalImage)), headers: { 'Content-Type': 'application/json' } }).catch(e => { if (e.status !== 409) throw e; });
            await ApiProxy.request(`/apis/apps/v1/namespaces/${NS}/deployments`, { method: 'POST', body: JSON.stringify(getTerminalDeployment(terminalImage)), headers: { 'Content-Type': 'application/json' } }).catch(e => { if (e.status !== 409) throw e; });
            await ApiProxy.request(`/api/v1/namespaces/${NS}/services`, { method: 'POST', body: JSON.stringify(terminalService), headers: { 'Content-Type': 'application/json' } }).catch(e => { if (e.status !== 409) throw e; });
            await checkResources();
        } catch (err: any) {
            setSetupError(`安装失败: ${err.message}`);
        } finally {
            setIsChecking(false);
        }
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (isChecking && areResourcesReady === null) {
        return <Paper sx={{p:2, m: 2}}><CircularProgress /> <Typography sx={{ml: 2, display: 'inline-block', verticalAlign: 'middle'}}>正在检查终端环境...</Typography></Paper>;
    }

    if (areResourcesReady === false) {
        return (
            <Paper sx={{ m: 2, p: 3 }}>
                <Typography variant="h4" gutterBottom>Kubexm控制台设置</Typography>
                <Alert severity="info" sx={{mb: 2}}>
                    看起来是您第一次使用本插件，需要先在集群中安装所需的后端服务。
                </Alert>
                <TextField
                    label="终端镜像地址"
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={terminalImage}
                    onChange={e => setTerminalImage(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <Button
                    variant="contained"
                    onClick={handleInstall}
                    disabled={isChecking}
                    startIcon={isChecking && <CircularProgress size={20} color="inherit" />}
                >
                    {isChecking ? '正在安装...' : '安装/修复后端服务'}
                </Button>
                {setupError && <Alert severity="error" sx={{mt: 2}}>{setupError}</Alert>}
            </Paper>
        );
    }

    const kubectlShellUrl = `http://${window.location.hostname}:${KUBECTL_SHELL_NODEPORT}`;
    const openUrlInNewTab = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

    return (
        <Paper sx={{ m: 2, p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Kubexm控制台
            </Typography>

            <Box sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>集群管理控制台(kubectl)</Typography>
                <Button variant="contained" color="primary" onClick={() => openUrlInNewTab(kubectlShellUrl)}>
                    打开集群管理控制台
                </Button>
            </Box>

            <Box>
                <Typography variant="h6" gutterBottom>节点控制台(root shell)</Typography>
                {isLoadingNodes ? <CircularProgress /> : (
                    <Paper component={Paper} variant="outlined">
                        <TableContainer>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>节点名称</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>IP地址</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>操作系统</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Kubelet版本</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {nodes
                                        ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map(node => {
                                            const nodeIP = getNodeIP(node);
                                            const nodeShellUrl = nodeIP ? `http://${nodeIP}:${NODE_SHELL_PORT}` : '';
                                            return (
                                                <TableRow key={node.metadata?.uid} hover>
                                                    <TableCell>{node.metadata?.name}</TableCell>
                                                    <TableCell>{nodeIP || 'Not Found'}</TableCell>
                                                    <TableCell>{node.status?.nodeInfo?.osImage}</TableCell>
                                                    <TableCell>{node.status?.nodeInfo?.kubeletVersion}</TableCell>
                                                    <TableCell align="right">
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            disabled={!nodeIP}
                                                            onClick={() => openUrlInNewTab(nodeShellUrl)}
                                                        >
                                                            控制台
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, { label: '全部', value: -1 }]}
                            component="div"
                            count={nodes?.length || 0}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            labelRowsPerPage="每页行数:"
                            labelDisplayedRows={({ from, to, count }) => `第 ${from} - ${to} 行，共 ${count} 行`}
                        />
                    </Paper>
                )}
            </Box>
        </Paper>
    );
}