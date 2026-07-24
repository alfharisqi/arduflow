import { Layout } from './components/Layout.jsx';
import { Home } from './pages/Home.jsx';
import { Ide } from './pages/Ide.jsx';
import { Access } from './pages/Access.jsx';
import { Program } from './pages/Program.jsx';
import { Tutorial } from './pages/Tutorial.jsx';
import { Project } from './pages/Project.jsx';
import { Partner } from './pages/Partner.jsx';
import { Contact } from './pages/Contact.jsx';
import { NotFound } from './pages/NotFound.jsx';

const routes = {
  '/': Home,
  '/ide': Ide,
  '/akses': Access,
  '/program': Program,
  '/tutorial': Tutorial,
  '/project': Project,
  '/partner': Partner,
  '/kontak': Contact,
};

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const Page = routes[path] || NotFound;

  return (
    <Layout>
      <Page />
    </Layout>
  );
}
