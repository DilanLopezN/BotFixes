import { Outlet } from 'react-router-dom';
import { SidebarMenu } from './sidebar-menu';
import { Layout } from './styles';

const { Sider } = Layout;

export const Settings = () => (
  <Layout hasSider>
    <Sider theme='light' width={224}>
      <SidebarMenu />
    </Sider>
    <Layout>
      <Outlet />
    </Layout>
  </Layout>
);
