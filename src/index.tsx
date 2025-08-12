import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import KubexmTerminalsPage from './components/KubexmTerminalsPage';

const PLUGIN_NAME = 'kubexm-terminals';

registerSidebarEntry({
    parent: null,
    name: PLUGIN_NAME,
    label: '控制台',
    url: `/${PLUGIN_NAME}`,
    icon: 'mdi:console-network-outline',
});

registerRoute({
    path: `/${PLUGIN_NAME}`,
    sidebar: PLUGIN_NAME,
    name: PLUGIN_NAME,
    exact: true,
    component: KubexmTerminalsPage,
});