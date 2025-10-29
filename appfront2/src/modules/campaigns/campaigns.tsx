import { Outlet } from 'react-router-dom';
import { SidebarMenu } from './sidebar-menu';
import { Layout } from './styles';

const { Sider } = Layout;

export const Campaigns = () => (
  <Layout hasSider>
    <Sider theme='light'>
      <SidebarMenu />
    </Sider>
    <Outlet />
  </Layout>
);
