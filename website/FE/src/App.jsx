import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { Layout } from './components/Layout.jsx';
import { LoadingIndicatorOverlay } from '@/components/application/loading-indicator/loading-indicator';

import { Home } from './pages/Home.jsx';
import { Access } from './pages/Access.jsx';
import { Program } from './pages/Program.jsx';

import { Workshop } from './pages/Workshop.jsx';
import { DaftarWorkshop } from './pages/DaftarWorkshop.jsx';
import { DetailWorkshop } from './pages/DetailWorkshop.jsx';
import { AdminTambahWorkshop } from './pages/admin/AdminTambahWorkshop.jsx';

import { Tutorial } from './pages/Tutorial.jsx';
import { TutorialDetail } from './pages/TutorialDetail.jsx';
import { Article } from './pages/Article.jsx';
import { ArticleDetail } from './pages/ArticleDetail.jsx';
import { Materi } from './pages/Materi.jsx';
import { BeginnerEbook } from './pages/BeginnerEbook.jsx';
import { IdeEbook } from './pages/IdeEbook.jsx';
import { HardwareEbook } from './pages/HardwareEbook.jsx';

import { Project } from './pages/Project.jsx';
import { ProjectAll } from './pages/ProjectAll.jsx';
import { ProjectDetail } from './pages/ProjectDetail.jsx';
import { Documentation } from './pages/Documentation.jsx';
import { Gallery } from './pages/Gallery.jsx';
import { GalleryDetail } from './pages/GalleryDetail.jsx';

import { About } from './pages/About.jsx';
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
import { UserLeadDashboard } from './pages/User/UserLeadDashboard.jsx';
import { UserPartnerDashboard } from './pages/User/UserPartnerDashboard.jsx';
import { UserIdeAccess } from './pages/User/UserIdeAccess.jsx';
import { UserSettings } from './pages/User/UserSettings.jsx';

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
  let loadPromise;
  const load = () => {
    loadPromise ||= loader().then((module) => ({
      default: module[exportName],
    }));

    return loadPromise;
  };
  const Component = lazy(load);

  Component.preload = load;

  return Component;
}

const AdminDashboard = lazyNamed(() => import('./pages/admin/AdminDashboard.jsx'), 'AdminDashboard');
const AdminUsers = lazyNamed(() => import('./pages/admin/AdminUsers.jsx'), 'AdminUsers');
const AdminVerification = lazyNamed(() => import('./pages/admin/AdminVerification.jsx'), 'AdminVerification');
const AdminProgram = lazyNamed(() => import('./pages/admin/AdminProgram.jsx'), 'AdminProgram');
const AdminLeads = lazyNamed(() => import('./pages/admin/AdminLeads.jsx'), 'AdminLeads');
const AdminCertificates = lazyNamed(() => import('./pages/admin/AdminCertificates.jsx'), 'AdminCertificates');
const AdminTransactions = lazyNamed(() => import('./pages/admin/AdminTransactions.jsx'), 'AdminTransactions');
const AdminTutorial = lazyNamed(() => import('./pages/admin/AdminTutorial.jsx'), 'AdminTutorial');
const AdminTutorialCreate = lazyNamed(() => import('./pages/admin/AdminTutorialForm.jsx'), 'AdminTutorialCreate');
const AdminTutorialEdit = lazyNamed(() => import('./pages/admin/AdminTutorialForm.jsx'), 'AdminTutorialEdit');
const AdminArticle = lazyNamed(() => import('./pages/admin/AdminArticle.jsx'), 'AdminArticle');
const AdminArticleCreate = lazyNamed(() => import('./pages/admin/AdminArticleForm.jsx'), 'AdminArticleCreate');
const AdminArticleEdit = lazyNamed(() => import('./pages/admin/AdminArticleForm.jsx'), 'AdminArticleEdit');
const AdminProjects = lazyNamed(() => import('./pages/admin/AdminProjects.jsx'), 'AdminProjects');
const AdminGallery = lazyNamed(() => import('./pages/admin/AdminGallery.jsx'), 'AdminGallery');
const AdminPartners = lazyNamed(() => import('./pages/admin/AdminPartners.jsx'), 'AdminPartners');
const AdminTestimonials = lazyNamed(() => import('./pages/admin/AdminTestimonials.jsx'), 'AdminTestimonials');
const AdminIde = lazyNamed(() => import('./pages/admin/AdminIde.jsx'), 'AdminIde');
const AdminSettings = lazyNamed(() => import('./pages/admin/AdminSettings.jsx'), 'AdminSettings');
const AdminDatabase = lazyNamed(() => import('./pages/admin/AdminDatabase.jsx'), 'AdminDatabase');

const routes = {
  '/': Home,

  '/ide': Access,
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
  '/artikel': Article,
  '/artikel/detail': ArticleDetail,
  '/materi': Materi,
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

  '/about': About,
  '/partner': About,
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
  '/lead-saya': UserLeadDashboard,
  '/partner-saya': UserPartnerDashboard,
  '/ide-saya': UserIdeAccess,
  '/transaksi': UserTransactions,
  '/sertifikat': UserCertificates,
  '/settings': UserSettings,

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
  '/admin/artikel': AdminArticle,
  '/admin/artikel/tambah': AdminArticleCreate,
  '/admin/artikel/edit': AdminArticleEdit,

  '/admin/projects': AdminProjects,
  '/admin/gallery': AdminGallery,
  '/admin/partners': AdminPartners,
  '/admin/testimonials': AdminTestimonials,
  '/admin/ide': AdminIde,
  '/admin/settings': AdminSettings,
  '/admin/database': AdminDatabase,
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
  '/lead-saya',
  '/partner-saya',
  '/ide-saya',
  '/transaksi',
  '/sertifikat',
  '/settings',

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
  '/admin/artikel',
  '/admin/artikel/tambah',
  '/admin/artikel/edit',

  '/admin/projects',
  '/admin/gallery',
  '/admin/partners',
  '/admin/testimonials',
  '/admin/ide',
  '/admin/settings',
  '/admin/database',

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
  '/lead-saya',
  '/partner-saya',
  '/ide-saya',
  '/transaksi',
  '/sertifikat',
  '/settings',
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

const RouteLoadingContext = createContext({
  markRouteReady: () => {},
});

/* =========================================================
   USER PROTECTED ROUTE
========================================================= */

function UserProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking');
  const { markRouteReady } = useContext(RouteLoadingContext);

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

    markRouteReady();

    showAuthRequiredAlert(
      'Silakan login sebagai user untuk membuka dashboard.'
    ).finally(() => {
      window.location.replace(
        '/signin'
      );
    });
  }, [markRouteReady, status]);

  useEffect(() => {
    if (status === 'allowed') {
      markRouteReady();
    }
  }, [markRouteReady, status]);

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
  const { markRouteReady } = useContext(RouteLoadingContext);

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

    markRouteReady();

    showAuthRequiredAlert(
      'Sesi admin tidak valid. Silakan login ulang.'
    ).finally(() => {
      window.location.replace(
        '/admin/login'
      );
    });
  }, [markRouteReady, status]);

  useEffect(() => {
    if (status === 'allowed') {
      markRouteReady();
    }
  }, [markRouteReady, status]);

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

function AppPageLoader({ path, pageComponent, requiresAuthGate, children }) {
  const [isLoading, setLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(true);
  const [isPagePreloaded, setPagePreloaded] = useState(false);
  const [isRouteGateReady, setRouteGateReady] = useState(false);
  const [isNetworkSettled, setNetworkSettled] = useState(false);
  const pendingFetchesRef = useRef(0);
  const markRouteReady = useCallback(() => setRouteGateReady(true), []);

  useEffect(() => {
    let isActive = true;
    let quietTimer = 0;
    const originalFetch = window.fetch.bind(window);

    function clearQuietTimer() {
      if (quietTimer) {
        window.clearTimeout(quietTimer);
        quietTimer = 0;
      }
    }

    function scheduleNetworkSettled() {
      clearQuietTimer();
      quietTimer = window.setTimeout(() => {
        if (isActive && pendingFetchesRef.current === 0) {
          setNetworkSettled(true);
        }
      }, 450);
    }

    setLoading(true);
    setShowLoading(true);
    setPagePreloaded(false);
    setRouteGateReady(!requiresAuthGate);
    setNetworkSettled(false);
    pendingFetchesRef.current = 0;

    window.fetch = (...args) => {
      pendingFetchesRef.current += 1;
      setNetworkSettled(false);
      clearQuietTimer();

      return originalFetch(...args).finally(() => {
        pendingFetchesRef.current = Math.max(0, pendingFetchesRef.current - 1);

        if (pendingFetchesRef.current === 0) {
          scheduleNetworkSettled();
        }
      });
    };

    const preload = typeof pageComponent?.preload === 'function'
      ? pageComponent.preload()
      : Promise.resolve();

    preload
      .catch(() => undefined)
      .finally(() => {
        if (!isActive) return;
        setPagePreloaded(true);
      });

    scheduleNetworkSettled();

    return () => {
      isActive = false;
      clearQuietTimer();
      window.fetch = originalFetch;
    };
  }, [pageComponent, path, requiresAuthGate]);

  useEffect(() => {
    if (!isPagePreloaded || !isRouteGateReady || !isNetworkSettled) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setLoading(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isNetworkSettled, isPagePreloaded, isRouteGateReady]);

  return (
    <RouteLoadingContext.Provider value={{ markRouteReady }}>
      {children}
      {showLoading ? (
        <LoadingIndicatorOverlay
          isLoading={isLoading}
          onDone={() => setShowLoading(false)}
          type="line-spinner"
          size="md"
        />
      ) : null}
    </RouteLoadingContext.Provider>
  );
}

export default function App() {
  const path =
    window.location.pathname.replace(
      /\/+$/,
      ''
    ) || '/';

  const routePath =
    path.startsWith('/detail-workshop/')
      ? '/detail-workshop'
      : path.startsWith('/workshop/detail/')
        ? '/workshop/detail'
        : path.startsWith('/materi/')
          ? '/materi'
          : path.startsWith('/tutorial/detail/')
            ? '/tutorial/detail'
            : path.startsWith('/artikel/detail/')
              ? '/artikel/detail'
              : path;

  const Page =
    routes[routePath] || NotFound;
  const requiresAuthGate = userProtectedRoutes.has(path) || (
    path.startsWith('/admin') &&
    !adminPublicRoutes.has(path)
  );

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

  let content;

  /* =======================================================
     STANDALONE
  ======================================================= */

  if (
    standaloneRoutes.has(path) ||
    Page === NotFound
  ) {
    content = page;
  } else {
    content = (
      <Layout>
        {page}
      </Layout>
    );
  }

  return (
    <AppPageLoader path={path} pageComponent={Page} requiresAuthGate={requiresAuthGate}>
      {content}
    </AppPageLoader>
  );
}
