import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import KubexmTerminalsPage from './components/KubexmTerminalsPage';

registerSidebarEntry({
    parent: null,
    name: 'kubexm-terminals-sidebar',
    label: 'Kubexm控制台',
    url: '/kubexm-terminals',
    icon: 'mdi:console-network-outline',
});

registerRoute({
    path: '/kubexm-terminals',
    sidebar: 'kubexm-terminals-sidebar',
    name: 'kubexm-terminals-route',
    exact: true,
    component: KubexmTerminalsPage,
});