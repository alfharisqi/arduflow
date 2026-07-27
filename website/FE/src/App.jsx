import { Layout } from './components/Layout.jsx';
import { Home } from './pages/Home.jsx';
import { Ide } from './pages/Ide.jsx';
import { Access } from './pages/Access.jsx';
import { Program } from './pages/Program.jsx';
import { Workshop } from './pages/Workshop.jsx';
import { Tutorial } from './pages/Tutorial.jsx';
import { Project } from './pages/Project.jsx';
import { Partner } from './pages/Partner.jsx';
import { Contact } from './pages/Contact.jsx';
import { SignIn } from './pages/auth/signin.jsx';
import { NotFound } from './pages/NotFound.jsx';

const routes = {
  '/': Home,
  '/ide': Ide,
  '/akses': Access,
  '/program': Program,
  '/workshop': Workshop,
  '/tutorial': Tutorial,
  '/project': Project,
  '/partner': Partner,
  '/kontak': Contact,
  '/signin': SignIn,
  '/sign-in': SignIn,
};

const authRoutes = new Set(['/signin', '/sign-in']);

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const Page = routes[path] || NotFound;

  if (authRoutes.has(path)) {
    return <Page />;
  }

  return (
    <Layout>
      <Page />
    </Layout>
  );
}
