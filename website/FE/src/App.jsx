import { Layout } from './components/Layout.jsx';
import { Home } from './pages/Home.jsx';
import { Ide } from './pages/Ide.jsx';
import { Access } from './pages/Access.jsx';
import { Program } from './pages/Program.jsx';
import { Workshop } from './pages/Workshop.jsx';
import { Tutorial } from './pages/Tutorial.jsx';
import { Project } from './pages/Project.jsx';
import { ProjectAll } from './pages/ProjectAll.jsx';
import { ProjectDetail } from './pages/ProjectDetail.jsx';
import { Documentation } from './pages/Documentation.jsx';
import { Partner } from './pages/Partner.jsx';
import { Contact } from './pages/Contact.jsx';
import { NotFound } from './pages/NotFound.jsx';

const routes = {
  '/': Home,
  '/ide': Ide,
  '/akses': Access,
  '/program': Program,
  '/workshop': Workshop,
  '/tutorial': Tutorial,
  '/project': Project,
  '/project/semua': ProjectAll,
  '/project/detail': ProjectDetail,
  '/project/dokumentasi': Documentation,
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
