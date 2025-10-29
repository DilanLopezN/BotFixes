import { Outlet } from 'react-router-dom';
import { SidebarMenu } from './sidebar-menu';
import { Layout } from './styles';

const { Sider } = Layout;

export const TrainerBot = () => (
  <Layout hasSider>
    <Sider theme='light'>
      <SidebarMenu />
    </Sider>
    <Outlet />
  </Layout>
);
