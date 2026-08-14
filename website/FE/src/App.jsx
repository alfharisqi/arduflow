import { lazy, Suspense, useEffect, useState } from 'react';

import { Layout } from './components/Layout.jsx';

import { Home } from './pages/Home.jsx';
import { Ide } from './pages/Ide.jsx';
import { Access } from './pages/Access.jsx';
import { Program } from './pages/Program.jsx';

import { Workshop } from './pages/Workshop.jsx';
import { DaftarWorkshop } from './pages/DaftarWorkshop.jsx';
import { DetailWorkshop } from './pages/DetailWorkshop.jsx';
import { AdminTambahWorkshop } from './pages/admin/AdminTambahWorkshop.jsx';

import { Tutorial } from './pages/Tutorial.jsx';
import { TutorialDetail } from './pages/TutorialDetail.jsx';
import { BeginnerEbook } from './pages/BeginnerEbook.jsx';
import { IdeEbook } from './pages/IdeEbook.jsx';
import { HardwareEbook } from './pages/HardwareEbook.jsx';

import { Project } from './pages/Project.jsx';
import { ProjectAll } from './pages/ProjectAll.jsx';
import { ProjectDetail } from './pages/ProjectDetail.jsx';
import { Documentation } from './pages/Documentation.jsx';
import { Gallery } from './pages/Gallery.jsx';
import { GalleryDetail } from './pages/GalleryDetail.jsx';

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
import { UserTransactions } from './pages/User/UserTransactions.jsx';
import { UserCertificates } from './pages/User/UserCertificates.jsx';

/* =========================
   ADMIN
========================= */

import { AdminLogin } from './pages/admin/AdminLogin.jsx';



import { NotFound } from './pages/NotFound.jsx';

import {
  getAdminSession,
  getUserSession,
} from './services/authApi.js';

import { showAuthRequiredAlert } from './utils/alerts.js';


/* =========================================================
   ROUTES
========================================================= */

function lazyNamed(loader, exportName) {
  return lazy(() =>
    loader().then((module) => ({
      default: module[exportName],
    }))
  );
}

const AdminDashboard = lazyNamed(() => import('./pages/admin/AdminDashboard.jsx'), 'AdminDashboard');
const AdminUsers = lazyNamed(() => import('./pages/admin/AdminUsers.jsx'), 'AdminUsers');
const AdminVerification = lazyNamed(() => import('./pages/admin/AdminVerification.jsx'), 'AdminVerification');
const AdminProgram = lazyNamed(() => import('./pages/admin/AdminProgram.jsx'), 'AdminProgram');
const AdminLeads = lazyNamed(() => import('./pages/admin/AdminLeads.jsx'), 'AdminLeads');
const AdminCertificates = lazyNamed(() => import('./pages/admin/AdminCertificates.jsx'), 'AdminCertificates');
const AdminTransactions = lazyNamed(() => import('./pages/admin/AdminTransactions.jsx'), 'AdminTransactions');
const AdminTutorial = lazyNamed(() => import('./pages/admin/AdminTutorial.jsx'), 'AdminTutorial');
const AdminTutorialCreate = lazyNamed(() => import('./pages/admin/AdminTutorialCreate.jsx'), 'AdminTutorialCreate');
const AdminTutorialEdit = lazyNamed(() => import('./pages/admin/AdminTutorialEdit.jsx'), 'AdminTutorialEdit');
const AdminProjects = lazyNamed(() => import('./pages/admin/AdminProjects.jsx'), 'AdminProjects');
const AdminGallery = lazyNamed(() => import('./pages/admin/AdminGallery.jsx'), 'AdminGallery');
const AdminPartners = lazyNamed(() => import('./pages/admin/AdminPartners.jsx'), 'AdminPartners');

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
  '/tutorial/detail': TutorialDetail,
  '/tutorial/panduan-pemula': BeginnerEbook,
  '/tutorial/penggunaan-ide': IdeEbook,
  '/tutorial/dasar-hardware-iot': HardwareEbook,

  '/project': Project,
  '/project/semua': ProjectAll,
  '/project/all': ProjectAll,
  '/project/detail': ProjectDetail,
  '/project/dokumentasi': Documentation,
  '/galeri': Gallery,
  '/galeri/detail': GalleryDetail,

  '/partner': Partner,
  '/kontak': Contact,

  /* =========================
     AUTH USER
  ========================= */

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

  /* =========================
     USER DASHBOARD
  ========================= */

  '/dashboard': DashboardUser,
  '/progress-belajar': UserLearningProgress,
  '/proyek-saya': UserProjectGallery,
  '/workshop-program': UserWorkshopSchedule,
  '/transaksi': UserTransactions,
  '/sertifikat': UserCertificates,

  /* =========================
     ADMIN
  ========================= */

  '/admin': AdminLogin,
  '/admin/login': AdminLogin,

  '/admin/dashboard': AdminDashboard,
  '/admin/users': AdminUsers,
  '/admin/verification': AdminVerification,
  '/admin/program': AdminProgram,
  '/admin/leads': AdminLeads,
  '/admin/certificates': AdminCertificates,
  '/admin/transactions': AdminTransactions,

  '/admin/tutorial': AdminTutorial,
  '/admin/tutorial/tambah': AdminTutorialCreate,
  '/admin/tutorial/edit': AdminTutorialEdit,

  '/admin/projects': AdminProjects,
  '/admin/gallery': AdminGallery,
  '/admin/partners': AdminPartners,
};


/* =========================================================
   STANDALONE ROUTES
========================================================= */

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

  /* USER */
  '/dashboard',
  '/progress-belajar',
  '/proyek-saya',
  '/workshop-program',
  '/transaksi',
  '/sertifikat',

  /* ADMIN */
  '/admin',
  '/admin/login',

  '/admin/dashboard',
  '/admin/users',
  '/admin/verification',
  '/admin/program',
  '/admin/leads',
  '/admin/certificates',
  '/admin/transactions',

  '/admin/tutorial',
  '/admin/tutorial/tambah',
  '/admin/tutorial/edit',

  '/admin/projects',
  '/admin/gallery',
  '/admin/partners',

  '/admin/tambah-workshop',
  '/admin/workshop/tambah',
]);


/* =========================================================
   USER PROTECTED ROUTES
========================================================= */

const userProtectedRoutes = new Set([
  '/dashboard',
  '/progress-belajar',
  '/proyek-saya',
  '/workshop-program',
  '/transaksi',
  '/sertifikat',
]);


/* =========================================================
   ADMIN PUBLIC ROUTES
========================================================= */

const adminPublicRoutes = new Set([
  '/admin',
  '/admin/login',
  '/admin/forgot-password',
]);

const DEBUG_AUTH = import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true';

/* =========================================================
   USER PROTECTED ROUTE
========================================================= */

function UserProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let isActive = true;

    const token = window.localStorage.getItem(
      'arduflow_user_token'
    );

    if (DEBUG_AUTH) {
      console.log('Token user:', token);
    }

    if (!token) {
      if (DEBUG_AUTH) {
        console.warn('Token user tidak ditemukan.');
      }

      window.localStorage.removeItem(
        'arduflow_user'
      );

      setStatus('blocked');

      return undefined;
    }

    getUserSession(token)
      .then((response) => {
        if (!isActive) {
          return;
        }

        if (DEBUG_AUTH) {
          console.log(
            'Response session user di App.jsx:',
            response
          );
        }

        const user =
          response?.user ||
          response?.data?.user;

        if (
          response?.success !== false &&
          user
        ) {
          if (DEBUG_AUTH) {
            console.log(
              'Session user valid:',
              user
            );
          }

          window.localStorage.setItem(
            'arduflow_user',
            JSON.stringify(user)
          );

          setStatus('allowed');

          return;
        }

        if (DEBUG_AUTH) {
          console.warn(
            'Session tidak valid atau data user tidak ditemukan:',
            response
          );
        }

        window.localStorage.removeItem(
          'arduflow_user'
        );

        window.localStorage.removeItem(
          'arduflow_user_token'
        );

        setStatus('blocked');
      })
      .catch((error) => {
        if (DEBUG_AUTH) {
          console.error(
            'Gagal memvalidasi session user:',
            error
          );
        }

        if (!isActive) {
          return;
        }

        window.localStorage.removeItem(
          'arduflow_user'
        );

        window.localStorage.removeItem(
          'arduflow_user_token'
        );

        setStatus('blocked');
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (status !== 'blocked') {
      return;
    }

    showAuthRequiredAlert(
      'Silakan login sebagai user untuk membuka dashboard.'
    ).finally(() => {
      window.location.replace(
        '/signin'
      );
    });
  }, [status]);

  if (status === 'checking') {
    return null;
  }

  if (status === 'blocked') {
    return null;
  }

  return children;
}


/* =========================================================
   ADMIN PROTECTED ROUTE
========================================================= */

function AdminProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let isActive = true;

    async function validateSession() {
      const token =
        window.localStorage.getItem(
          'arduflow_admin_token'
        );

      if (DEBUG_AUTH) {
        console.log(
          'Token admin tersedia:',
          Boolean(token)
        );
      }

      if (
        !token ||
        token === 'undefined' ||
        token === 'null'
      ) {
        if (DEBUG_AUTH) {
          console.warn(
            'Token admin tidak ditemukan di localStorage.'
          );
        }

        window.localStorage.removeItem(
          'arduflow_admin'
        );

        window.localStorage.removeItem(
          'arduflow_admin_token'
        );

        if (isActive) {
          setStatus('blocked');
        }

        return;
      }

      try {
        const response =
          await getAdminSession(token);

        if (!isActive) {
          return;
        }

        if (DEBUG_AUTH) {
          console.log(
            'Response session admin di App.jsx:',
            response
          );
        }

        const admin =
          response?.admin ||
          response?.data?.admin;

        if (
          response?.success !== false &&
          admin
        ) {
          if (DEBUG_AUTH) {
            console.log(
              'Session admin valid:',
              admin
            );
          }

          window.localStorage.setItem(
            'arduflow_admin',
            JSON.stringify(admin)
          );

          setStatus('allowed');

          return;
        }

        if (DEBUG_AUTH) {
          console.warn(
            'Session admin tidak valid atau data admin tidak ditemukan:',
            response
          );
        }

        window.localStorage.removeItem(
          'arduflow_admin'
        );

        window.localStorage.removeItem(
          'arduflow_admin_token'
        );

        setStatus('blocked');
      } catch (error) {
        if (DEBUG_AUTH) {
          console.error(
            'Gagal memvalidasi session admin:',
            error
          );
        }

        if (!isActive) {
          return;
        }

        window.localStorage.removeItem(
          'arduflow_admin'
        );

        window.localStorage.removeItem(
          'arduflow_admin_token'
        );

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

    showAuthRequiredAlert(
      'Sesi admin tidak valid. Silakan login ulang.'
    ).finally(() => {
      window.location.replace(
        '/admin/login'
      );
    });
  }, [status]);

  if (status === 'checking') {
    return null;
  }

  if (status === 'blocked') {
    return null;
  }

  return children;
}


/* =========================================================
   APP
========================================================= */

export default function App() {
  const path =
    window.location.pathname.replace(
      /\/+$/,
      ''
    ) || '/';

  const Page =
    routes[path] || NotFound;

  let page =
    <Page />;

  /* =======================================================
     USER PROTECTED
  ======================================================= */

  if (
    userProtectedRoutes.has(path)
  ) {
    page = (
      <UserProtectedRoute>
        {page}
      </UserProtectedRoute>
    );
  }

  /* =======================================================
     ADMIN PROTECTED
  ======================================================= */

  if (
    path.startsWith('/admin') &&
    !adminPublicRoutes.has(path)
  ) {
    page = (
      <AdminProtectedRoute>
        {page}
      </AdminProtectedRoute>
    );
  }

  page = (
    <Suspense fallback={null}>
      {page}
    </Suspense>
  );

  /* =======================================================
     STANDALONE
  ======================================================= */

  if (
    standaloneRoutes.has(path)
  ) {
    return page;
  }

  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (
    Page === NotFound
  ) {
    return page;
  }

  /* =======================================================
     PUBLIC PAGE + LAYOUT
  ======================================================= */

  return (
    <Layout>
      {page}
    </Layout>
  );
}
