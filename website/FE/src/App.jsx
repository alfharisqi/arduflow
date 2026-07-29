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
import { SignUp } from './pages/auth/signup.jsx';
import { EmailVerification } from './pages/auth/email-verification.jsx';
import { ResetPassword } from './pages/auth/reset-password.jsx';
import { ResetPasswordSent } from './pages/auth/reset-password-sent.jsx';
import { ResetPasswordForm } from './pages/auth/reset-password-form.jsx';
import { DashboardUser } from './pages/User/DashboardUser.jsx';
import { UserLearningProgress } from './pages/User/UserLearningProgress.jsx';
import { UserProjectGallery } from './pages/User/UserProjectGallery.jsx';
import { UserWorkshopSchedule } from './pages/User/UserWorkshopSchedule.jsx';
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
  '/signup': SignUp,
  '/sign-up': SignUp,
  '/signup/email-verification': EmailVerification,
  '/sign-up/email-verification': EmailVerification,
  '/verify-email': EmailVerification,
  '/reset-password': ResetPassword,
  '/forgot-password': ResetPassword,
  '/reset-password/email-sent': ResetPasswordSent,
  '/forgot-password/email-sent': ResetPasswordSent,
  '/reset-password-sent': ResetPasswordSent,
  '/reset-password/form': ResetPasswordForm,
  '/reset-password/new-password': ResetPasswordForm,
  '/new-password': ResetPasswordForm,
  '/dashboard': DashboardUser,
  '/progress-belajar': UserLearningProgress,
  '/proyek-saya': UserProjectGallery,
  '/workshop-program': UserWorkshopSchedule,
};

const standaloneRoutes = new Set([
  '/signin',
  '/sign-in',
  '/signup',
  '/sign-up',
  '/signup/email-verification',
  '/sign-up/email-verification',
  '/verify-email',
  '/reset-password',
  '/forgot-password',
  '/reset-password/email-sent',
  '/forgot-password/email-sent',
  '/reset-password-sent',
  '/reset-password/form',
  '/reset-password/new-password',
  '/new-password',
  '/dashboard',
  '/progress-belajar',
  '/proyek-saya',
  '/workshop-program',
]);

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const Page = routes[path] || NotFound;

  if (standaloneRoutes.has(path)) {
    return <Page />;
  }

  return (
    <Layout>
      <Page />
    </Layout>
  );
}
