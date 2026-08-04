import { useEffect, useState } from 'react';
import { Layout } from './components/Layout.jsx';
import { Home } from './pages/Home.jsx';
import { Ide } from './pages/Ide.jsx';
import { Access } from './pages/Access.jsx';
import { Program } from './pages/Program.jsx';
import { Workshop } from './pages/Workshop.jsx';
import { DaftarWorkshop } from './pages/DaftarWorkshop.jsx';
import { DetailWorkshop } from './pages/DetailWorkshop.jsx';
import { AdminTambahWorkshop } from './pages/AdminTambahWorkshop.jsx';
import { Tutorial } from './pages/Tutorial.jsx';
import { BeginnerEbook } from './pages/BeginnerEbook.jsx';
import { IdeEbook } from './pages/IdeEbook.jsx';
import { HardwareEbook } from './pages/HardwareEbook.jsx';
import { Project } from './pages/Project.jsx';
import { ProjectAll } from './pages/ProjectAll.jsx';
import { ProjectDetail } from './pages/ProjectDetail.jsx';
import { Documentation } from './pages/Documentation.jsx';
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
import { UserCertificates } from './pages/User/UserCertificates.jsx';
import { AdminLogin } from './pages/admin/AdminLogin.jsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx';
import { AdminUsers } from './pages/admin/AdminUsers.jsx';
import { AdminVerification } from './pages/admin/AdminVerification.jsx';
import { AdminProgram } from './pages/admin/AdminProgram.jsx';
import { AdminLeads } from './pages/admin/AdminLeads.jsx';
import { AdminCertificates } from './pages/admin/AdminCertificates.jsx';
import { AdminTutorial } from './pages/admin/AdminTutorial.jsx';
import { AdminProjects } from './pages/admin/AdminProjects.jsx';
import { AdminGallery } from './pages/admin/AdminGallery.jsx';
import { AdminPartners } from './pages/admin/AdminPartners.jsx';
import { NotFound } from './pages/NotFound.jsx';
import { getAdminSession, getUserSession } from './services/authApi.js';
import { showAuthRequiredAlert } from './utils/alerts.js';

const routes = {
  '/': Home,
  '/ide': Ide,
  '/akses': Access,
  '/program': Program,
  '/workshop': Workshop,
  '/daftar-workshop': DaftarWorkshop,
  '/workshop/daftar': DaftarWorkshop,
  '/detail-workshop': DetailWorkshop,
  '/workshop/detail': DetailWorkshop,
  '/admin/tambah-workshop': AdminTambahWorkshop,
  '/admin/workshop/tambah': AdminTambahWorkshop,
  '/tutorial': Tutorial,
  '/tutorial/panduan-pemula': BeginnerEbook,
  '/tutorial/penggunaan-ide': IdeEbook,
  '/tutorial/dasar-hardware-iot': HardwareEbook,
  '/project': Project,
  '/project/semua': ProjectAll,
  '/project/all': ProjectAll,
  '/project/detail': ProjectDetail,
  '/project/dokumentasi': Documentation,
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
  '/sertifikat': UserCertificates,
  '/admin': AdminLogin,
  '/admin/login': AdminLogin,
  '/admin/dashboard': AdminDashboard,
  '/admin/users': AdminUsers,
  '/admin/verification': AdminVerification,
  '/admin/program': AdminProgram,
  '/admin/leads': AdminLeads,
  '/admin/certificates': AdminCertificates,
  '/admin/tutorial': AdminTutorial,
  '/admin/projects': AdminProjects,
  '/admin/gallery': AdminGallery,
  '/admin/partners': AdminPartners,
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
  '/sertifikat',
  '/admin',
  '/admin/login',
  '/admin/dashboard',
  '/admin/users',
  '/admin/verification',
  '/admin/program',
  '/admin/leads',
  '/admin/certificates',
  '/admin/tutorial',
  '/admin/projects',
  '/admin/gallery',
  '/admin/partners',
  '/admin/tambah-workshop',
  '/admin/workshop/tambah',
]);

const userProtectedRoutes = new Set([
  '/dashboard',
  '/progress-belajar',
  '/proyek-saya',
  '/workshop-program',
  '/sertifikat',
]);

const adminPublicRoutes = new Set([
  '/admin',
  '/admin/login',
  '/admin/forgot-password',
]);

function UserProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let isActive = true;
    const token = window.localStorage.getItem('arduflow_user_token');

    if (!token) {
      window.localStorage.removeItem('arduflow_user');
      setStatus('blocked');
      return undefined;
    }

    getUserSession(token).then((data) => {
      if (!isActive) return;
      window.localStorage.setItem('arduflow_user', JSON.stringify(data.user));
      setStatus('allowed');
    }).catch(() => {
      if (!isActive) return;
      window.localStorage.removeItem('arduflow_user');
      window.localStorage.removeItem('arduflow_user_token');
      setStatus('blocked');
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (status !== 'blocked') return;
    showAuthRequiredAlert('Silakan login sebagai user untuk membuka dashboard.').finally(() => {
      window.location.replace('/signin');
    });
  }, [status]);

  if (status !== 'allowed') {
    return null;
  }

  return children;
}

function AdminProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let isActive = true;

    async function validateSession() {
      const token = window.localStorage.getItem('arduflow_admin_token');

      if (!token) {
        window.localStorage.removeItem('arduflow_admin');
        setStatus('blocked');
        return;
      }

      try {
        const data = await getAdminSession(token);

        if (!isActive) {
          return;
        }

        window.localStorage.setItem('arduflow_admin', JSON.stringify(data.admin));
        setStatus('allowed');
      } catch (_error) {
        if (!isActive) {
          return;
        }

        window.localStorage.removeItem('arduflow_admin');
        window.localStorage.removeItem('arduflow_admin_token');
        setStatus('blocked');
      }
    }

    validateSession();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (status !== 'blocked') {
      return;
    }

    showAuthRequiredAlert('Sesi admin tidak valid. Silakan login ulang.').finally(() => {
      window.location.replace('/admin/login');
    });
  }, [status]);

  if (status !== 'allowed') {
    return null;
  }

  return children;
}

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const Page = routes[path] || NotFound;
  let page = <Page />;

  if (userProtectedRoutes.has(path)) {
    page = <UserProtectedRoute>{page}</UserProtectedRoute>;
  }

  if (path.startsWith('/admin') && !adminPublicRoutes.has(path)) {
    page = <AdminProtectedRoute>{page}</AdminProtectedRoute>;
  }

  if (standaloneRoutes.has(path)) {
    return page;
  }

  if (Page === NotFound) {
    return page;
  }

  return (
    <Layout>
      {page}
    </Layout>
  );
}
